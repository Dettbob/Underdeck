#!/usr/bin/env python3
"""Turn a PC build of Underdeck (one .html file) into the iPhone home-screen web app in this repo.

Usage:  python3 tools/mobilize.py path/to/Underdeck.html

What it does:
  1. Adds touch support (tap / long-press card tips, iOS audio unlock) and the phone layout.
  2. Adds saving of the run in progress ("Pokračovat" in the menu) and the backup code ("Záloha postupu").
  3. Wraps the page with the home-screen app head (manifest, icon, full screen) and writes index.html.
  4. Bumps the offline cache version in sw.js so phones pick up the new build.

Each step looks for an exact piece of the game's code. If the PC build changed that piece,
the script stops and names the step, so it can be fixed by hand (see tools/mobile/README.md).
"""
import hashlib, os, re, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIECES = os.path.join(ROOT, 'tools', 'mobile')
piece = lambda n: open(os.path.join(PIECES, n), encoding='utf-8').read()

src = open(sys.argv[1], encoding='utf-8').read()
if 'ud_run' in src or 'tipx' in src:
    sys.exit('Tenhle soubor už mobilní úpravy obsahuje. Dej mi čistý PC build.')
problems = []

def rep(name, old, new, count=1, required=True):
    global src
    n = src.count(old)
    if n != count:
        if required:
            problems.append(f'{name}: hledaný kus kódu nalezen {n}× (čekáno {count}×): {old[:90]!r}')
        return
    src = src.replace(old, new)

def rep_re(name, pattern, new):
    global src
    out, n = re.subn(pattern, new, src, count=1)
    if n != 1:
        problems.append(f'{name}: vzor nenalezen: {pattern[:90]!r}')
    src = out

# --- 1. layout + touch ---
rep('css', '</style>', piece('mobile.css') + '</style>')
idx = src.rfind('</script>')
src = src[:idx] + piece('touch.js') + src[idx:]
rep('rules-tips', 'najetím myší', 'najetím myší (na telefonu klepnutím nebo podržením)', count=src.count('najetím myší') or 1, required=False)
rep('gallery-hint', 'Najetím myší uvidíš popis', 'Najetím myší (na telefonu klepnutím) uvidíš popis', required=False)
rep('rules-drag', '<li>Kartu přetáhni na jedno z míst.', '<li>Kartu přetáhni na jedno z míst (na telefonu prstem). Klepnutím na kartu nebo podržením prstu na Roomu zobrazíš popis.', required=False)

# --- 2. saving + backup ---
rep_re('newGame-tut', r"S=\{mode,", "S={mode,tut:!!tut,")
rep_re('modal-save', r"(function modal\(\)\{\n?[^\n]*?wxUpdate\(\);)", r"\1\n  runSave();")
rep_re('menu-resume', r"if\(menuOpen\)\{\$\('menu'\)\.hidden=false;o\.hidden=true;\$\('mbtns'\)\.innerHTML=`<button class=\"b go\" data-act=\"camp\"",
       "if(menuOpen){$('menu').hidden=false;o.hidden=true;const R=resumeState();$('mbtns').innerHTML=(R?`<button class=\"b go cont\" data-act=\"resume\">Pokračovat<small>${R.mode==='camp'?'Výprava · Room '+R.roomNo+'/'+(typeof NROOM!=='undefined'?NROOM:15):'Klasická hra'} · ♥ ${R.hp}/${R.max}</small></button>`:'')+`<button class=\"b ${R?'':'go'}\" data-act=\"camp\"")
rep_re('menu-backup', r'<div class="mrow">', '<div class="mrow"><button class="b rst" data-act="backup">Záloha postupu</button>')
rep_re('new-game-confirm', r"else if\(a==='single'\|\|a==='camp'\)\{tutEnd\(\);menuOpen=false;viewDeck=false;newGame\(a\);\}",
       "else if(a==='single'||a==='camp'){const go=()=>{tutEnd();menuOpen=false;viewDeck=false;runClear();newGame(a);};if(resumeState())devConfirm('Rozehraná hra se tím ukončí a nepůjde se k ní vrátit. Diamanty a vylepšení zůstanou.',go,'Začít novou hru?','Začít novou');else go();}\n  else if(a==='resume')runResume();\n  else if(a==='backup')bakOpen();")
if re.search(r"if\(busy&&!\[[^\]]*\]\.includes\(a\)\)return;", src):
    rep_re('busy-allow', r"(if\(busy&&!\[)([^\]]*\]\.includes\(a\)\)return;)", r"\1'resume','backup',\2")
else:
    rep_re('busy-allow', r"if\(busy&&a!=='single'&&a!=='camp'&&a!=='tut'\)return;",
           "if(busy&&!['single','camp','tut','resume','backup','report','reset'].includes(a))return;")
rep_re('boot-dummy', r"newGame\('single'\);menuOpen=true;modal\(\);", "newGame('single',true);S.dummy=true;menuOpen=true;modal();")
rep_re('tutorial-flag', r"(function startTutorial\(\)\{\n\s*)newGame\('single'\);", r"\1newGame('single',true);")
rep('save-code', '// tutorial: a coach panel', piece('save.js') + '// tutorial: a coach panel')
rep('backup-markup', '<div id="devc" hidden>', piece('backup.html') + '<div id="devc" hidden>')

if problems:
    print('Nepovedlo se automaticky:\n- ' + '\n- '.join(problems))
    sys.exit(1)

# --- 3. home-screen app wrapper ---
head = '''<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Underdeck">
<meta name="theme-color" content="#15191c">
<meta name="format-detection" content="telephone=no">
<script>var UD_BUILD='{build}';</script>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<style>
html,body{margin:0;overscroll-behavior:none}
body{padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);box-sizing:border-box;min-height:100vh}
</style>
'''
tail = '''
<script>
if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
'''
body = re.sub(r'(?is)^\s*<!doctype[^>]*>|</?html[^>]*>|</?body[^>]*>|</?head>', '', src)
i = body.index('</style>') + len('</style>')
head = head.replace('{build}', hashlib.sha1(open(sys.argv[1],'rb').read()).hexdigest()[:10])
out = head + body[:i] + '\n</head>\n<body>\n' + body[i:] + tail + '</body>\n</html>\n'
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(out)

# --- 4. new cache version ---
sw = os.path.join(ROOT, 'sw.js')
t = open(sw, encoding='utf-8').read()
t = re.sub(r"const VER='[^']*';", f"const VER='underdeck-{time.strftime('%Y%m%d-%H%M')}';", t)
open(sw, 'w', encoding='utf-8').write(t)
print('Hotovo: index.html a sw.js jsou aktualizované.')
