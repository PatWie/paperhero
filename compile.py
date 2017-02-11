import os
import sass
from jsmin import jsmin

sass.compile(dirname=("dev/scss", "css"), output_style='compact', source_comments=False)

for file in os.listdir("dev/js"):
    with open(os.path.join("dev/js", file)) as js_file:
        minified = jsmin(js_file.read(), quote_chars="'\"`")
        with open(os.path.join("js", file[:-3] + ".min.js"), "w") as h:
            h.write(minified)
