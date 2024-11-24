import gleam/list as l
import gleam/string as s
import gleam/bool as b
import gleam/option as opt
import gleam/regex as re

import types/text

// Style predicates
pub fn is_link(str: String) -> Bool {
    s.contains(str, "http")
}

pub fn is_inline_code(str: String) -> Bool {
    s.contains(str, "`")
}

pub fn split_on_predicate(ls: List(String), predicate: fn(String) -> Bool) -> #(List(String), List(String)) {
    l.split_while(ls, fn(x) { predicate(x) |> b.negate })
}

// Appiles styling on predicate
pub fn style_text(text: text.Text, predictate: fn(String) -> Bool, style_desc: text.Text) -> List(text.Text) {
    // Sanitise inputs
    let words: List(String) = s.split(text.text, " ")
    let input: #(List(String), List(String)) = split_on_predicate(words, predictate)
    style_helper(input, [], predictate, text, style_desc)
}

// the actual recursive part of the function
pub fn style_helper(input: #(List(String), List(String)), output: List(text.Text), predictate: fn(String) -> Bool, default: text.Text, style_desc: text.Text) -> List(text.Text) {
    case input {
        #(t, []) -> l.append(output, [text.Text(..default, text:s.join(t, " "))])
        #([], l) -> {
            // Pop the first elem, which will be what we want to style - recur on the rest
            case l {
                [] -> output
                [x, ..xs] -> {
                    let styled = text.Text(..style_desc, text: x)
                    style_helper(split_on_predicate(xs, predictate), l.append(output, [styled]), predictate, default, style_desc)
                }
            }
        }
        #(x, xs) -> style_helper(split_on_predicate(xs, predictate), l.append(output, [text.Text(..default, text: s.join(x, " "))]), predictate, default, style_desc)
    }
}

// Uses regex to get extract_link_params for inline links
pub fn extract_link_params(str: String) -> opt.Option(#(String, String)) {
    // regex
    let options = re.Options(case_insensitive: False, multi_line: True)
    let assert Ok(re) = re.compile("\\((.+)\\).\\[(.+)\\]", with: options)
    // let assert Ok(re) = re.compile("\\((.+)\\).[([^]]+)", with: options)
    case re.scan(re, str) {
        [] -> opt.None
        [x, .._] -> {
            case opt.values(x.submatches) {
                [x, y] -> opt.Some(#(s.replace(x, "%20", " "), y))
                _ -> opt.None
            }
        }
    }
}

// Buffer fn for sanity
pub fn buffer(str: String, buffer: String, no: Int) -> String {
    s.repeat(buffer, no) <> str
}
