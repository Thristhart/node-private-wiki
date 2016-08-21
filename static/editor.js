var codeMirrorConfig = {
    mode: "gfm",
    theme: "default"
};
var editor = CodeMirror.fromTextArea(document.querySelector("textarea"), codeMirrorConfig);

editor.on("change", function() {
    let source = editor.getValue();
    let sourceWithPrettyTags = source.replace(/{{((?:(?:\s*\w+\s*)\|*)+)}}/g, "").replace(/{{\s*\/\s*}}/g, "");
    document.querySelector(".preview").innerHTML = marked(sourceWithPrettyTags);
});

var form = document.querySelector("form");

form.addEventListener("submit", function() {
    form.source.value = editor.getValue();
});