import gleam/list as l
import gleam/string as s

import lustre/effect

import types/text
import types/model.{type Model}
import types/model as mdl
import types/msg.{type Msg}

@external(javascript, "../app.ffi.mjs", "after")
fn do_after(timeout: Int, callback: fn() -> Nil) -> Nil

fn after(timeout: Int, msg: Msg) -> effect.Effect(Msg) {
    use dispatch <- effect.from
    use <- do_after(timeout)

    dispatch(msg)
}

pub fn relay_status(model: Model) -> #(Model, effect.Effect(Msg)) {
    // Read the output queque
    case model.status_q {
        []              -> #(mdl.Model(..model, state: mdl.GO), effect.none())
        [first, ..rest] -> init_pretty_status("", first, mdl.Model(..model, state: mdl.InputsLocked, status_q: rest))
    }
}

pub fn init_pretty_status(char: String, line: text.Text, model: Model) -> #(Model, effect.Effect(Msg)) {
    let new_model = mdl.Model(..model, status: l.append(model.status, [text.Text(..line, text: "")]))
    pretty_status(char, line.text, new_model)
}

pub fn pretty_status(char: String, str: String, model: Model) -> #(Model, effect.Effect(Msg)) {
    // First we want to get the lastest output field
    let #(history, recent) = l.split(model.status, {l.length(model.status) - 1})
    let assert [output] = recent
    // Now we start the recursion
    case str {
        "" -> #(mdl.Model(..model, status: l.append(history, [text.Text(..output, text: output.text <> char)])), after(25, msg.RelayStatus))
        _  -> {
            let split = s.pop_grapheme(str)
            case split {
                Ok(val) -> {
                    let model = mdl.Model(..model, status: l.append(history, [text.Text(..output, text: output.text <> char)]))
                    let effect = after(0, msg.PrettyPrintStatus(char: val.0, str: val.1))
                    #(model, effect)
                }
                // Assuming that this will error it tries to split a single char
                Error(Nil) -> #(mdl.Model(..model, status: l.append(history, [text.Text(..output, text: output.text <> char)])), after(25, msg.RelayStatus))
            }
        }
    }
}

