# logseq-chordpro-render

Logseq plugin for rendering ChordPro songs directly in place without replacing the source block.

The original song stays in your graph as a fenced code block, and the plugin renders a readable chord sheet on top in Logseq preview.

Thanks to @bergbrains for [ChordproJSParser](https://github.com/bergbrains/ChordproJSParser).

## What It Does

- Renders fenced `chordpro` and `chords` blocks inline on the page
- Supports legacy `[[chordpro]]` blocks as a fallback
- Adds `+` and `-` transpose controls to rendered songs
- Lets you click a chord to open that chord in Logseq's native right sidebar
- Maintains a `Master Chordlist` page with one chord block per chord
- Renders chord diagrams in that `Master Chordlist` via a macro renderer
- Uses `{define: ...}` chord definitions when present
- Falls back to a built-in chord library for many common chords
- On `page-type:: chordpro` pages, ensures a top-level `played` block exists
- Adds today's journal link under `played` when missing, so songs can be tracked automatically

## Example

````markdown
```chordpro
{title: Some Cool Song}
{artist: Some Cool Artist}
{define: C base-fret 1 frets x 3 2 0 1 0}

and som[C]e chor[Am]dpro content
```
````

You can also use:

````markdown
```chords
...
```
````

## Song Tracking

When you open a page with:

```markdown
page-type:: chordpro
```

the plugin will make sure the page contains:

```markdown
- played
  - [[2026-03-20]]
```

It only adds today's journal link if it is not already there.

This makes it easy to build Logseq queries for:

- songs played today
- songs played in the last 7 days
- songs played in the last 30 days

## Chord Sidebar Flow

Clicking a rendered chord will:

1. find or create the matching chord block on `Master Chordlist`
2. open that block in Logseq's native right sidebar
3. render the chord diagram there through the plugin macro

## Installation

### Manual Installation

```bash
git clone https://github.com/olterman/logseq-chordpro-render.git
cd logseq-chordpro-render
npm install
npm run build
```

Then in Logseq:

1. turn on Developer mode
2. open Plugins
3. choose `Load unpacked plugin`
4. select the `logseq-chordpro-render` directory

## Development

```bash
npm install
npm run build
```

If your Logseq plugin folder is symlinked to this repo, a rebuild plus plugin reload is enough to test changes.

## Notes

- The plugin is built around fenced code rendering first.
- Legacy `[[chordpro]]` support still exists, but fenced blocks are the primary path.
- The built-in chord library is meant as a fallback, not a replacement for proper `{define: ...}` lines.
