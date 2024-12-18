import gleam/list as l
import gleam/string as s

import lustre/effect

import types/text
import types/model.{type Model}
import types/model as mdl
import types/data
import types/msg.{type Msg}
import output/text_styling as ts

@external(javascript, "../app.ffi.mjs", "after")
fn do_after(timeout: Int, callback: fn() -> Nil) -> Nil

fn after(timeout: Int, msg: Msg) -> effect.Effect(Msg) {
    use dispatch <- effect.from
    use <- do_after(timeout)

    dispatch(msg)
}

//AutoScroll downward with each print
@external(javascript, "../app.ffi.mjs", "scrollToBottom")
fn anchor (div: String) -> Nil

pub fn init_pretty_print(char: String, line: text.Text, model: Model) -> #(Model, effect.Effect(Msg)) {
    let new_model = mdl.Model(..model, output: l.append(model.output, [text.Text(text: "", style: line.style, html: line.html)]))
    pretty_print(char, line.text, new_model)
}

pub fn pretty_print(char: String, str: String, model: Model) -> #(Model, effect.Effect(Msg)) {
    anchor("crt")
    // First we want to get the lastest output field
    let #(history, recent) = l.split(model.output, {l.length(model.output) - 1})
    let assert [output] = recent
    // Now we start the recursion
    case str {
        "" -> #(mdl.Model(..model, output: l.append(history, [text.Text(text: output.text <> char, style: output.style, html: output.html)])), after(25, msg.ChainPrint))
        _  -> {
            let split = s.pop_grapheme(str)
            case split {
                Ok(val) -> {
                    let model = mdl.Model(..model, output: l.append(history, [text.Text(text: output.text <> char, style: output.style, html: output.html)]))
                    let effect = after(0, msg.PrettyPrint(char: val.0, str: val.1))
                    #(model, effect)
                }
                // Assuming that this will error it tries to split a single char
                Error(Nil) -> #(mdl.Model(..model, output: l.append(history, [text.Text(text: output.text <> char, style: output.style, html: output.html)])), after(25, msg.ChainPrint))
            }
        }
    }
}

// Auto format
fn process_text(text: String) -> List(text.Text) {
    let txt = text.Text(text, "", text.Span)
    ts.style_text(txt, ts.is_link, text.Text("", "underline text-purple-400 hover:text-purple-300", text.Link))
        |> l.flat_map(ts.style_text(_, ts.is_inline_code, text.Text("", "text-neutral-900 bg-purple-500", text.Span)))
        |> l.intersperse(text.Text(" ", "", text.Span))
}


// Takes some json and outputs a line to print
fn read_json(json: data.Record) -> List(text.Text) {
    let desc = process_text(json.desc)
    l.append([text.Text(text: json.title <> "\n\n", style: "underline text-purple-400", html: text.Span)], desc)
}

// Finds a proficiency in a list of records
fn find_by_title(title: String, rec: data.Record) -> Result(data.Record, Nil) {
    case rec.title == title {
        True  -> Ok(rec)
        False -> Error(Nil)
    }
}

// We simply need to recur over the list of records in the JsonData to chain output
pub fn init_text_rendering(data: data.JsonData, model: Model) -> #(Model, effect.Effect(Msg)) {
    // Rest the model flag
    let new_model = mdl.Model(..model, flag: data.Flag("" , "", ""))
    let new_new_model = {
        case l.find_map(data.records, find_by_title(model.flag.header, _)) {
            Ok(rec) -> mdl.Model(..new_model, output_q: read_json(rec))
            _       -> {
                case model.flag.flag {
                    "--all" -> {
                        case l.map(data.records, read_json) {
                            [first, ..last] -> {
                                let updated_last = l.map(last, fn(ls) {l.append([text.Text("\n\n", "", text.Span)], ls)}) |> l.flatten
                                mdl.Model(..new_model, output_q: l.append(first, updated_last))
                            }
                            _ -> mdl.Model(..new_model, output_q: l.map(data.records, read_json) |> l.flatten) 
                        }
                    }
                    _ -> mdl.Model(..new_model, output_q: [text.Text("Incorrect Flag: " <> model.flag.flag, "text-yellow-500", text.Span)])
                }
            }
        }
    }
    render_text(new_new_model)
}

pub fn render_text(model: Model) -> #(Model, effect.Effect(Msg)) {
    // Read the output queque
    case model.output_q {
        []              -> #(mdl.Model(..model, state: mdl.GO), effect.none())
        [first, ..rest] -> init_pretty_print("", first, mdl.Model(..model, state: mdl.InputsLocked, output_q: rest))
    }
}
