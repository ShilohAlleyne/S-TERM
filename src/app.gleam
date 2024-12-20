import gleam/string as s
import gleam/list as l
import gleam/option as opt

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
import output/text_styling as ts
import output/status
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
    case msg {
        // Init
        msg.FetchedCommands(data) -> status.relay_status(mdl.startup(data))
        msg.FetchedCommandsFailed -> status.relay_status(mdl.Model(..mdl.serious_error("Failed to init correctly, refresh page to restart", model), state: mdl.LoadingFailed))
        // Inputs
        msg.KeyPress(key)           -> cmd.parse_keypress(key, model)
        msg.UpdateInput(value)      -> #(mdl.Model(..model, input: value), effect.none())
        msg.InvalidCommand(command) -> rend.render_text(mdl.error("Invalid Command: " <> command, model))
        msg.Reset                   -> #(mdl.Model(..model, input: "", output: [], output_q: []), effect.none())
        //Text Rendering
        msg.PrettyPrint(char, str)           -> rend.pretty_print(char, str, model)
        msg.InitPrettyPrint(char, txt, mod)  -> rend.init_pretty_print(char, txt, mod)
        msg.ChainPrint                       -> rend.render_text(model)
        // Status display
        msg.PrettyPrintStatus(char, str)          -> status.pretty_status(char, str, model)
        msg.InitPrettyPrintStatus(char, txt, mod) -> status.init_pretty_status(char, txt, mod)
        msg.RelayStatus                           -> status.relay_status(model)
        //Api Calls
        msg.FetchedData(data) -> rend.init_text_rendering(data, model)
        msg.FetchFailed       -> rend.render_text(mdl.serious_error("Failed to retrive data", model))
        msg.DownloadPDF       -> pdf.download_pdf(model)
    }
}

fn view(model: Model) {
    let header = [
        "_____/\\\\\\\\\\\\\\\\\\\\\\__________________/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\__/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\____/\\\\\\\\\\\\\\\\\\______/\\\\\\\\____________/\\\\\\\\_         ",
        " ___/\\\\\\/////////\\\\\\_______________\\///////\\\\\\/////__\\/\\\\\\///////////___/\\\\\\///////\\\\\\___\\/\\\\\\\\\\\\________/\\\\\\\\\\\\_        ",
        "  __\\//\\\\\\______\\///______________________\\/\\\\\\_______\\/\\\\\\_____________\\/\\\\\\_____\\/\\\\\\___\\/\\\\\\//\\\\\\____/\\\\\\//\\\\\\_       ",
        "   ___\\////\\\\\\__________/\\\\\\\\\\\\\\\\\\\\\\_______\\/\\\\\\_______\\/\\\\\\\\\\\\\\\\\\\\\\_____\\/\\\\\\\\\\\\\\\\\\\\\\/____\\/\\\\\\\\///\\\\\\/\\\\\\/_\\/\\\\\\_      ",
        "    ______\\////\\\\\\______\\///////////________\\/\\\\\\_______\\/\\\\\\///////______\\/\\\\\\//////\\\\\\____\\/\\\\\\__\\///\\\\\\/___\\/\\\\\\_     ",
        "     _________\\////\\\\\\_______________________\\/\\\\\\_______\\/\\\\\\_____________\\/\\\\\\____\\//\\\\\\___\\/\\\\\\____\\///_____\\/\\\\\\_    ",
        "      __/\\\\\\______\\//\\\\\\______________________\\/\\\\\\_______\\/\\\\\\_____________\\/\\\\\\_____\\//\\\\\\__\\/\\\\\\_____________\\/\\\\\\_   ",
        "       _\\///\\\\\\\\\\\\\\\\\\\\\\/_______________________\\/\\\\\\_______\\/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_\\/\\\\\\______\\//\\\\\\_\\/\\\\\\_____________\\/\\\\\\_  ",
        "        ___\\///////////_________________________\\///________\\///////////////__\\///________\\///__\\///______________\\///__ ",
    ]

    // Background
    h.div(
        [
            class("p-50 m-0 leading-inherit bg-[#121212] min-h-screen"),
            id("Background")
        ],
        [
            // Scanlines
            h.div([class("scanline")], []),
            // App div
            h.div(
                [class("px-[4.5rem] py-[6.0rem] absolute top-0 bottom-0 w-full selection:bg-purple-500 selection:text-neutral-900"), id("crt")],
                [
                    h.div(
                        [class("crt p-5 h-full w-full overflow-y-auto scroll-smooth text-lg"), id("terminal")],
                        [
                            h.div(
                                [class("flex justify-center items-center")],
                                [
                                    // Header
                                    h.figure(
                                        [class("font-consolas text-purple-500")],
                                        [
                                            h.pre(
                                                [class("font-consolas")],
                                                [text(s.join(header, "\n"))]
                                            ),
                                            h.pre(
                                                [class("font-mono py-2")],
                                                [
                                                    h.span(
                                                        [],
                                                        [text(
                                                            " " <> ts.buffer(" Type ", "=", 36)
                                                            |> ts.buffer(" ", 9))
                                                        ],
                                                    ),
                                                    h.span(
                                                        [class("text-purple-300")],
                                                        [text("'help'")]
                                                    ),
                                                    h.span(
                                                        [],
                                                        [text(" to see the list of available commands. " <> ts.buffer("\n", "=", 35))]
                                                    ),
                                                ]
                                            ),
                                            // Model Status
                                            h.pre(
                                                [class("whitespace-pre-wrap font-mono text-purple-500"), id("status")],
                                                l.map(
                                                    model.status,
                                                    fn (line: text.Text) -> Element(Msg) {
                                                        h.span([class(line.style)], [text(line.text)])
                                                    }
                                                )
                                            ),
                                        ]
                                    ),
                                ]
                            ),
                            // Output
                            h.pre(
                                [class("whitespace-pre-wrap font-mono text-purple-500"), id("output")],
                                l.map(
                                    model.output,
                                    // Text rendering lambda
                                    fn (line: text.Text) -> Element(Msg) {
                                        case line.html {
                                            text.Span -> h.span([class(line.style)], [text(line.text)])
                                            text.Link -> case ts.extract_link_params(line.text) {
                                                // Inline links
                                                opt.Some(#(x, y)) -> h.a([a.href(y)], [h.span([class(line.style)], [text(x)])])
                                                opt.None          -> h.a([a.href(line.text)], [h.span([class(line.style)], [text(line.text)])])
                                            }
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
