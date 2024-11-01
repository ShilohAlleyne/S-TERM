import lustre/effect

import types/text
import types/model.{type Model}
import types/msg.{type Msg}
import types/model as mdl
import output/text_rendering as rend

// Download PDF js
@external(javascript, "../app.ffi.mjs", "downloadPDF")
fn download () -> Nil

pub fn download_pdf(model: Model) -> #(Model, effect.Effect(Msg)) {
    download()
    let output_msg = [
        text.Text("PDF Downloaded.", "text-green-500", html: text.Span)
    ]
    rend.render_text(mdl.Model(..model, output_q: output_msg))
}
