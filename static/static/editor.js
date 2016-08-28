var codeMirrorConfig = {
    mode: "gfm",
    theme: "default",
    lineWrapping: true
};
var editor = CodeMirror.fromTextArea(document.querySelector("textarea"), codeMirrorConfig);

let dirty = false;

editor.on("change", function() {
    dirty = true;
    let source = editor.getValue();
    let sourceWithPrettyTags = source.replace(/{{((?:(?:\s*\w+\s*)\|*)+)}}/g, "").replace(/{{\s*\/\s*}}/g, "");
    document.querySelector(".preview").innerHTML = marked(sourceWithPrettyTags);
});

var form = document.querySelector("form");

form.addEventListener("submit", function() {
    form.source.value = editor.getValue();
    dirty = false;
});

window.onbeforeunload = function (){
  if(dirty) {
      return "You have unsaved changes. Are you sure you want to navigate away?";
  }
  else {
  // no changes - return nothing
  }
};