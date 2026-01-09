# logseq-chordpro-render

This is a small plugin to render logseq blocks with chordpro content as actual guitar chordsheets 
It is a work in progress and my first attempt att creating a logseq plugin ... 

I give thanks to @bergbrains for his [ChordproJSParser](https://github.com/bergbrains/ChordproJSParser)

after adding the plugin to logseq any page with a block that contains: 
```[[chordpro]]
{title: some cool song}
{artist: some cool artist}

and som[C]e chor[Am]dpro content
``` 
will render an html block with text/chords 

## Prerequisites
You need to have [node](https://nodejs.org/) and [npm or yarn](https://yarnpkg.com/getting-started/install) installed on your system.

## Manual Installation 
- clone this repo and build the plugin 
>```
git clone https://github.com/olterman/logseq-chordpro-render.git
cd logseq-chordpro-render
npm install 
npm run build 
```
- open Logseq Desktop client and turn on Developer mode in user settings panel
- open the toolbar dot menus and navigate to plugins page
- navigate to the plugins dashboard: tp
- click Load unpacked plugin button, then select the logseq-chordpro-render directory to load it 

## TODO
- add Style settings 
- move render to the top of page without destroying outline structure
- make the html replace the chordpro on the page instead of in a sibling block 
- change polling so it doesnt trigger when editing a block (currently polling is disabled)

