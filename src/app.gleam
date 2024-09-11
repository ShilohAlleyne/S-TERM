 
import gleam/string as s

import lustre
import lustre/effect
import lustre/event
import lustre/element.{text}
import lustre/element/html as h
import lustre/attribute as a
import lustre/attribute.{class, id,autofocus}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

type Model {
    Model(
        command: String,
        output: String
    )
}

fn init(_flags) -> #(Model, effect.Effect(Msg)) {
    #(Model("", ""), effect.none())
}

type Msg {
    KeyPress(String)
    UpdateInput(String)
    Reset
}

fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
    case msg {
        KeyPress(key) -> {
            case key {
                // Run command function on Enter
                "Enter" -> #(Model(..model, command: "", output: model.output <> "\n" <> model.command), effect.none())
                _       -> #(model, effect.none())
            }
        }
        // Update the command value
        UpdateInput(value) -> #(Model(..model, command: value), effect.none())
        Reset -> #(Model(..model, output: ""), effect.none())
    }
}

fn view(model: Model) {
    let header: List(String) = [
        "      ___                       ___           ___           ___     ",
        "     /  /\\          ___        /  /\\         /  /\\         /__/\\    ",
        "    /  /:/_        /  /\\      /  /:/_       /  /::\\       |  |::\\   ",
        "   /  /:/ /\\      /  /:/     /  /:/ /\\     /  /:/\\:\\      |  |:|:\\  ",
        "  /  /:/ /::\\    /  /:/     /  /:/ /:/_   /  /:/~/:/    __|__|:|\\:\\ ",
        " /__/:/ /:/\\:\\  /  /::\\    /__/:/ /:/ /\\ /__/:/ /:/___ /__/::::| \\:\\",
        " \\  \\:\\/:/~/:/ /__/:/\\:\\   \\  \\:\\/:/ /:/ \\  \\:\\/:::::/ \\  \\:\\~~\\__\\/",
        "  \\  \\::/ /:/  \\__\\/  \\:\\   \\  \\::/ /:/   \\  \\::/~~~~   \\  \\:\\      ",
        "   \\__\\/ /:/        \\  \\:\\   \\  \\:\\/:/     \\  \\:\\        \\  \\:\\     ",
        "     /__/:/          \\__\\/    \\  \\::/       \\  \\:\\        \\  \\:\\    ",
        "     \\__\\/                     \\__\\/         \\__\\/         \\__\\/    "
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
                        [class("p-5 h-full w-full overflow-y-auto box-border border-2 border-purple-800")], 
                        [
                            // Header
                            h.figure(
                                [class("Consolas text-purple-500")], 
                                [
                                    h.pre(
                                        [],
                                        [text(s.join(header, "\n"))]
                                    ),
                                    h.figcaption(
                                        [class("Consolas text-purple-400 drop-shadow-glow")],
                                        [text("© 2024")]
                                    ),
                                    h.pre(
                                        [class("py-2")],
                                        [text("---\n"                                             <>
                                              "Type 'help' tp see a list of avalible commands.\n" <>
                                              "---")]
                                    )
                                ]
                            ),
                            h.pre(
                                [class("Consolas text-purple-500"), id("output")],
                                [text(model.output)]
                            ),
                            //Input
                            h.div(
                                [class("flex")], 
                                [   //Runner
                                    h.div(
                                        [class("flex-none py-2")], 
                                        [
                                            h.span(
                                                [class("Consolas text-purple-300")],
                                                [text("@runner → ")]
                                            ),
                                            h.span(
                                                [class("Consolas text-purple-400")],
                                                [text("~/shiloh_alleyne/cv ")]
                                            ),
                                            h.span(
                                                [class("Consolas text-purple-300")],
                                                [text("⚡︎main ❱")]
                                            )
                                        ]
                                    ),
                                    // Text Input
                                    h.input(
                                        [
                                            id("input"),
                                            a.value(model.command),
                                            event.on_input(UpdateInput),
                                            event.on_keypress(KeyPress),
                                            autofocus(True),
                                            class("flex-auto px-2 w-full Consolas text-purple-500 bg-transparent border-none focus:outline-none")
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

fn pretty_print() {
    todo("I think we can recusively send a msg with that adds one character to output div at a time")
}
