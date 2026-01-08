# logseq-chordpro-render

This is a small plugin to render logseq blocks with chordpro content as actual guitar chordsheets 
It is a work in progress and my first attempt att creating a logseq plugin ... 

I give thanks to @bergbrains for his [ChordproJSParser](https://github.com/bergbrains/ChordproJSParser)

after adding the plugin to logseq any page with a block that contains: 
```[[logseq]]
{title: some cool song}
{artist: some cool artist}

and som[C]e chor[Am]dpro content
``` 
will render an html block with text/chords 

TODO
- add css that actually shows in logseq (today I add the CSS by hand in custom CSS)
- make the html replace the chordpro on the page instead of in a sub block 

