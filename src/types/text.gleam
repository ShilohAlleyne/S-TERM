// Indvidual line styling 
pub type Text {
    Text(text: String, style: String, html: ElemType)
}

pub type ElemType {
    Span
    Link
}

// Defualt line
pub fn new() -> Text {
    Text("", "", Span)
}
