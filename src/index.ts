// <reference types="@logseq/libs" />
import ChordproJS from 'chordprojs';

let pollTimer: number | null = null;
const seenHashes = new Map<string, string>();

// CSS settings 
const chordFormating = ""
const lyricsColor = ""



function log(...args: any[]) {
  console.log("🎵 [ChordPro]", ...args);
}

// simple content hash for change detection
function hash(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

// sanitize input:
// - remove [[chordpro]] tag
// - remove other [[links]]
// - remove {comment: ...} tags
// - trim
function sanitizeChordPro(input: string): string {
  return input
    .replace(/\[\[chordpro\]\]\s*\n?/gi, "")
    .replace(/\`\`\`chords\s*\n?/gi, "")
    .replace(/\`\`\`*\n?/gi, "")
    .replace(/\[\[[^\]]+\]\]/g, "")
    //.replace(/\{comment:[^}]*\}/gi, "")
    .trim();
}

function makeShiny(input: string): string {
  /* CHORDPRO CSS 
  Main CSS Classes
    .chord-line - Applied to chord lines (pre element)
    .lyric-line - Applied to lyric lines (pre element)
*/
  const preStyle = "background:none; padding: 0em 0em 0em 0em; margin: 0em 0 0em 0em;"
  const chordStyle = "color: #c678dd; font-wight: bold;"
  const lyricStyle = "color: #abb2bf;"
    //.lyric-line-only - Applied to lyric lines when chords are hidden
    //.comment - Applied to comment lines
    //.comment-italic - Applied to italic comment lines
    //.comment-box - Applied to boxed comment lines
    //.highlight - Applied to highlighted text
    //.section - Applied to all section containers
    //.section-label - Applied to section labels
    //.chorus - Applied to chorus containers
    //.verse - Applied to verse containers
    //.bridge - Applied to bridge sections
    //.tab - Applied to tab sections
    //.grid - Applied to grid sections
    //.abc - Applied to ABC notation sections
    //.ly - Applied to LilyPond notation sections
    //.svg - Applied to SVG content sections
    //.textblock - Applied to text block sections
    //.chorus-ref - Applied to chorus references
    //.chord-diagram - Applied to chord diagrams
    //.chord-name - Applied to chord names in diagrams
    //.chord-definition - Applied to chord definitions in diagrams
    //.page-break - Applied to page breaks
    //.physical-page-break - Applied to physical page breaks
    //.column-break - Applied to column breaks
    //.image - Applied to image containers
    const emptyLineStyle ="background:none; padding: 0em 0em 0em 0em; margin: 0em 0 0em 0em;";
    //.artist - Applied to artist information
    //.key - Applied to key information
  return input
    .replaceAll("<pre class=\"chord-line\">", "<pre class=\"chord-line\" style=\"" + preStyle + chordStyle + "\">")
    .replaceAll("<pre class=\"lyric-line\">", "<pre class=\"lyric-line\" style=\"" + preStyle + lyricStyle + "\">")
    //.lyric-line-only - Applied to lyric lines when chords are hidden
    //.comment - Applied to comment lines
    //.comment-italic - Applied to italic comment lines
    //.comment-box - Applied to boxed comment lines
    //.highlight - Applied to highlighted text
    //.section - Applied to all section containers
    //.section-label - Applied to section labels
    //.chorus - Applied to chorus containers
    //.verse - Applied to verse containers
    //.bridge - Applied to bridge sections
    //.tab - Applied to tab sections
    //.grid - Applied to grid sections
    //.abc - Applied to ABC notation sections
    //.ly - Applied to LilyPond notation sections
    //.svg - Applied to SVG content sections
    //.textblock - Applied to text block sections
    //.chorus-ref - Applied to chorus references
    //.chord-diagram - Applied to chord diagrams
    //.chord-name - Applied to chord names in diagrams
    //.chord-definition - Applied to chord definitions in diagrams
    //.page-break - Applied to page breaks
    //.physical-page-break - Applied to physical page breaks
    //.column-break - Applied to column breaks
    //.image - Applied to image containers
    .replaceAll("<div class=\"empty-line\">", "<div class=\"empty-line\" style=\"" + emptyLineStyle + "\">")
    //.artist - Applied to artist information
    //.key - Applied to key information
    //.replaceAll("</pre>", "</pre>\n")
    
}

async function detectAndRender(reason: string) {
  log("Detect triggered:", reason);
  //const editing = logseq.Editor.checkEditing();
  //const isEditing = await logseq.App.getStateFromStore('editor/in-composition?');
  //log("isEditing:", isEditing )
  //if ( editing ){
    //log("User is editing, wait");
    //return;
 // } else {
    const page = await logseq.Editor.getCurrentPage();
    if (!page || typeof page.uuid !== "string") return;

    const blocks = await logseq.Editor.getPageBlocksTree(page.uuid);
    if (!blocks) return;
  //}
  // recursively find first block containing "[chordpro]]" or "{title:"
  // To allocate chordpro conten
  function find(nodes: any[]): any | null {
    for (const b of nodes) {
      if (
        typeof b.content === "string" &&
        b.content.toLowerCase().includes("[[chordpro]]") ||
        b.content.toLowerCase().includes("{title:") ||
        b.content.toLowerCase().includes("\`\`\`chords") 
      ) {
        return b;
      }
      if (b.children?.length) {
        const found = find(b.children);
        if (found) return found;
      }
    }
    return null;
  }

  const block = find(blocks);
  if (!block || typeof block.uuid !== "string") return;

 
  const source = block.content
  const chordpro = ChordproJS();
  const contentHash = hash(source); 
  
  // skip if content unchanged
  if (seenHashes.get(block.uuid) === contentHash) return;
  seenHashes.set(block.uuid, contentHash);

  log("FOUND chordpro block:", block.uuid);

  let html; 
  try {
    // add a newline at the end to avoid JS-ChordPro parse errors
    const doc = sanitizeChordPro(source);
    //g("Sanitized source:\n", doc);
    //const style = "<head><style>.chord-line { color: #0066cc; font-weight: bold; } .title {color: #e06c75;  /* Pink for title */}</style></head>";
    html = makeShiny(chordpro.renderToHTML(doc));
    // html = style + chordpro.renderToHTML(doc);
    // After rendering

  } catch (err) {
    console.error("🎵 [ChordPro] Render error", err, { source });
    return;
  }

	// remove previously rendered HTML children
	try {
      const children = await logseq.Editor.getCurrentPageBlocksTree();
  		for (const child of children ?? []) {
        //log("FOUND child", child.content);
    		//if (typeof child.content === "string" && child.content.includes("[[chordpro]]")) {
          //logseq.Editor.setBlockCollapsed(child.uuid, true);
          const sibling = await logseq.Editor.getNextSiblingBlock(block.uuid); 
          //log(" '----> sibling content", sibling?.content)
          if ( typeof sibling?.content === "string" && sibling.content.includes("<h1>")) { 
          log("FOUND sibling with HTML-> killing it", sibling.uuid);
          //log("sibling content", sibling.content)
          await logseq.Editor.removeBlock(sibling.uuid);
          }
      
  		}
	} catch (err) {
  			console.warn("🎵 [ChordPro] Could not fetch children, skipping removal", err);
	}



  // insert rendered HTML
  await logseq.Editor.insertBlock(
    block.uuid,
    //`\`\`\`html\n${html}\n\`\`\``,
    `${html}\n`,
    { sibling: true }   
  );

 /* If we need to reinsert the chordpro content 

    await logseq.Editor.insertBlock(
    block.uuid,
    //`\`\`\`html\n${html}\n\`\`\``,
    `${source}\n`,
    { sibling: true }
     
  );*/

  log("Rendered successfully");
  
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = window.setInterval(() => {
    detectAndRender("poll");
  }, 1500);
}

async function main() {
  console.log("🎵 ChordPro renderer plugin loaded");

  setTimeout(() => detectAndRender("startup"), 800);

  logseq.App.onRouteChanged(() => {
    seenHashes.clear();
    detectAndRender("route-change");
  });

  //logseq.App.onBlockRendererSlotted()
  //startPolling();
}

logseq.ready(main);
