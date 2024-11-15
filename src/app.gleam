import gleam/io
import gleam/string as s
import gleam/list as l

import lustre
import lustre/effect
import lustre/event
import lustre/element.{type Element, text}
import lustre/element/html as h
import lustre/attribute as a
import lustre/attribute.{class, id,autofocus}

import api/api
import output/text_rendering as rend
import output/command_parsing as cmd 
import output/pdf_download as pdf
import types/text
import types/model.{type Model}
import types/model as mdl
import types/msg.{type Msg}

pub fn main() {
    let app = lustre.application(init, update, view)
    let assert Ok(_) = lustre.start(app, "#app", Nil)
    Nil
}

fn init(_flags) -> #(Model, effect.Effect(Msg)) {
    #(mdl.init(), effect.from(api.get_commands))
}

fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
    io.debug(model.output)
    case msg {
        // Init
        msg.FetchedCommands(data) -> rend.render_text(mdl.startup(data))
        msg.FetchedCommandsFailed -> rend.render_text(mdl.Model(..mdl.serious_error("Failed to correct init refresh page to restart", model), state: mdl.LoadingFailed))
        // Inputs
        msg.KeyPress(key)           -> cmd.parse_keypress(key, model)
        msg.UpdateInput(value)      -> #(mdl.Model(..model, input: value), effect.none())
        msg.InvalidCommand(command) -> rend.render_text(mdl.error("Invalid Command: " <> command, model))
        msg.Reset                   -> #(mdl.Model(..model, input: "", output: [], output_q: []), effect.none())
        //Text Rendering
        msg.PrettyPrint(char, str)           -> rend.pretty_print(char, str, model)
        msg.InitPrettyPrint(char, txt, mod)  -> rend.init_pretty_print(char, txt, mod)
        msg.ChainPrint                       -> rend.render_text(model)
        //Api Call
        msg.FetchedData(data)     -> rend.init_text_rendering(data, model)
        msg.FetchFailed           -> rend.render_text(mdl.serious_error("Failed to retrive data", model))
        msg.DownloadPDF           -> pdf.download_pdf(model) 
    }
}

fn view(model: Model) {
    let header = [
        "      ___                          ___           ___           ___      ",
        "     /  /\\             ___        /  /\\         /  /\\         /__/\\     ",
        "    /  /:/_           /  /\\      /  /:/_       /  /::\\       |  |::\\    ",
        "   /  /:/ /\\         /  /:/     /  /:/ /\\     /  /:/\\:\\      |  |:|:\\   ",
        "  /  /:/ /::\\       /  /:/     /  /:/ /:/_   /  /:/~/:/    __|__|:|\\:\\  ",
        " /__/:/ /:/\\:\\     /  /::\\    /__/:/ /:/ /\\ /__/:/ /:/___ /__/::::| \\:\\ ",
        " \\  \\:\\/:/~/:/    /__/:/\\:\\   \\  \\:\\/:/ /:/ \\  \\:\\/:::::/ \\  \\:\\~~\\__\\/ ",
        "  \\  \\::/ /:/  ___\\__\\/  \\:\\   \\  \\::/ /:/   \\  \\::/~~~~   \\  \\:\\       ",
        "   \\__\\/ /:/  /__/\\    \\  \\:\\   \\  \\:\\/:/     \\  \\:\\        \\  \\:\\      ",
        "     /__/:/   \\__\\/     \\__\\/    \\  \\::/       \\  \\:\\        \\  \\:\\     ",
        "     \\__\\/                        \\__\\/         \\__\\/         \\__\\/ "
    ]
    // Background
    h.div(
        [class("m-0 leading-inherit bg-[#121212] min-h-screen"), id("Background")], 
        [
            // App div
            h.div(
                [class("p-5 absolute top-0 bottom-0 w-full selection:bg-purple-500 selection:text-neutral-900"), id("App-app")], 
                [
                    h.div(
                        [class("p-5 h-full w-full overflow-y-auto scroll-smooth box-border border-2 border-purple-800 text-lg"), id("App-App-App")], 
                        [
                            // Header
                            h.figure(
                                [class("font-consolas text-purple-500")], 
                                [
                                    h.pre(
                                        [class("font-consolas")],
                                        [
                                            text(s.join(header, "\n")),
                                            h.span(
                                                [class("font-mono text-purple-400 drop-shadow-glow")],
                                                [text("© 2024")]
                                            )
                                        ]
                                    ),
                                    h.pre(
                                        [class("font-mono py-2")],
                                        [
                                            h.span(
                                                [],
                                                [text("============== Type ")],
                                            ),
                                            h.span(
                                                [class("text-purple-300")],
                                                [text("'help'")] 
                                            ),
                                            h.span(
                                                [],
                                                [text(" to see the list of available commands. ===============\n")]
                                            ),
                                            h.span(
                                                [class("text-purple-300")],
                                                [text("                                                                  made in gleam ★")]
                                            )
                                        ]
                                    )
                                ]
                            ), 
                            // Output
                            h.pre(
                                [class("whitespace-pre-wrap font-mono text-purple-500"), id("output")],
                                l.map(
                                    model.output, 
                                    fn (line: text.Text) -> Element(Msg) {
                                        case line.html {
                                            text.Span -> h.span([class(line.style)], [text(line.text)])
                                            text.Link -> h.a([a.href(line.text)], [h.span([class(line.style)], [text(line.text)])])
                                        }
                                    }
                                )
                            ),
                            //Input
                            h.pre(
                                [class("flex pt-4")], 
                                [   //Runner
                                    h.pre(
                                        [class("flex-none")], 
                                        [
                                            h.span(
                                                [class("font-bold font-mono text-purple-300")],
                                                [text("[")]
                                            ),
                                            h.span(
                                                [class("font-mono text-purple-400")],
                                                [text("runner")]
                                            ),
                                            h.span(
                                                [class("font-bold font-mono text-purple-300")],
                                                [text("] [")]
                                            ),
                                            h.span(
                                                [class("font-mono text-purple-400")],
                                                [text("🖿 ~/shiloh-alleyne/cv")]
                                            ),
                                            h.span(
                                                [class("font-bold font-mono text-purple-300")],
                                                [text("] [")]
                                            ),
                                            h.span(
                                                [class("font-mono text-purple-400")],
                                                [text("🗲main")]
                                            ),
                                            h.span(
                                                [class("font-bold font-mono text-purple-300")],
                                                [text("]")]
                                            ),
                                            h.span(
                                                [class("font-bold font-mono text-purple-400")],
                                                [text(" ❱")]
                                            ),
                                            h.span(
                                                [class("font-bold font-mono text-purple-300")],
                                                [text("❱")]
                                            )

                                        ]
                                    ),
                                    // Text Input
                                    h.input(
                                        [
                                            id("input"),
                                            a.value(model.input),
                                            event.on_input(msg.UpdateInput),
                                            event.on_keydown(msg.KeyPress),
                                            autofocus(True),
                                            a.autocomplete("off"),
                                            class("snap center flex-auto px-2 w-full font-mono text-purple-500 bg-transparent border-none focus:outline-none")
                                        ]
                                    )
                                ]
                            ),
                        ]
                    )
                ]
            )
        ]
    )
}
