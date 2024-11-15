// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label) => label in fields ? fields[label] : this[label]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length5 = 0;
    for (let _ of this)
      length5++;
    return length5;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index5) {
    return this.buffer[index5];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    return new _BitArray(this.buffer.slice(start3, end));
  }
  // @internal
  sliceAfter(index5) {
    return new _BitArray(this.buffer.slice(index5));
  }
};
var UtfCodepoint = class {
  constructor(value3) {
    this.value = value3;
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  let value3 = 0;
  if (isBigEndian) {
    for (let i = start3; i < end; i++) {
      value3 = value3 * 256 + byteArray[i];
    }
  } else {
    for (let i = end - 1; i >= start3; i--) {
      value3 = value3 * 256 + byteArray[i];
    }
  }
  if (isSigned) {
    const byteSize = end - start3;
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value3 >= highBit) {
      value3 -= highBit * 2;
    }
  }
  return value3;
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view2 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view2.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view2.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a2 = values.pop();
    let b = values.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a2);
    for (let k of keys2(a2)) {
      values.push(get2(a2, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error2 = new globalThis.Error(message);
  error2.gleam_error = variant;
  error2.module = module;
  error2.line = line;
  error2.function = fn;
  error2.fn = fn;
  for (let k in extra)
    error2[k] = extra[k];
  return error2;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function from_result(result) {
  if (result.isOk()) {
    let a2 = result[0];
    return new Some(a2);
  } else {
    return new None();
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/regex.mjs
var Match = class extends CustomType {
  constructor(content, submatches) {
    super();
    this.content = content;
    this.submatches = submatches;
  }
};
var CompileError = class extends CustomType {
  constructor(error2, byte_index) {
    super();
    this.error = error2;
    this.byte_index = byte_index;
  }
};
var Options = class extends CustomType {
  constructor(case_insensitive, multi_line) {
    super();
    this.case_insensitive = case_insensitive;
    this.multi_line = multi_line;
  }
};
function compile(pattern, options) {
  return compile_regex(pattern, options);
}
function scan(regex, string4) {
  return regex_scan(regex, string4);
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function parse(string4) {
  return parse_int(string4);
}
function to_string2(x) {
  return to_string(x);
}
function max(a2, b) {
  let $ = a2 > b;
  if ($) {
    return a2;
  } else {
    return b;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/pair.mjs
function second(pair) {
  let a2 = pair[1];
  return a2;
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function count_length(loop$list, loop$count) {
  while (true) {
    let list3 = loop$list;
    let count = loop$count;
    if (list3.atLeastLength(1)) {
      let list$1 = list3.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length2(list3) {
  return count_length(list3, 0);
}
function do_reverse(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(xs) {
  return do_reverse(xs, toList([]));
}
function is_empty(list3) {
  return isEqual(list3, toList([]));
}
function first(list3) {
  if (list3.hasLength(0)) {
    return new Error(void 0);
  } else {
    let x = list3.head;
    return new Ok(x);
  }
}
function do_filter(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list3.head;
      let xs = list3.tail;
      let new_acc = (() => {
        let $ = fun(x);
        if ($) {
          return prepend(x, acc);
        } else {
          return acc;
        }
      })();
      loop$list = xs;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list3, predicate) {
  return do_filter(list3, predicate, toList([]));
}
function do_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list3.head;
      let xs = list3.tail;
      loop$list = xs;
      loop$fun = fun;
      loop$acc = prepend(fun(x), acc);
    }
  }
}
function map2(list3, fun) {
  return do_map(list3, fun, toList([]));
}
function do_try_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let x = list3.head;
      let xs = list3.tail;
      let $ = fun(x);
      if ($.isOk()) {
        let y = $[0];
        loop$list = xs;
        loop$fun = fun;
        loop$acc = prepend(y, acc);
      } else {
        let error2 = $[0];
        return new Error(error2);
      }
    }
  }
}
function try_map(list3, fun) {
  return do_try_map(list3, fun, toList([]));
}
function drop(loop$list, loop$n) {
  while (true) {
    let list3 = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list3;
    } else {
      if (list3.hasLength(0)) {
        return toList([]);
      } else {
        let xs = list3.tail;
        loop$list = xs;
        loop$n = n - 1;
      }
    }
  }
}
function do_take(loop$list, loop$n, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list3.hasLength(0)) {
        return reverse(acc);
      } else {
        let x = list3.head;
        let xs = list3.tail;
        loop$list = xs;
        loop$n = n - 1;
        loop$acc = prepend(x, acc);
      }
    }
  }
}
function take(list3, n) {
  return do_take(list3, n, toList([]));
}
function do_append(loop$first, loop$second) {
  while (true) {
    let first3 = loop$first;
    let second2 = loop$second;
    if (first3.hasLength(0)) {
      return second2;
    } else {
      let item = first3.head;
      let rest$1 = first3.tail;
      loop$first = rest$1;
      loop$second = prepend(item, second2);
    }
  }
}
function append2(first3, second2) {
  return do_append(reverse(first3), second2);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function do_concat(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list3 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list3, acc);
    }
  }
}
function flatten(lists) {
  return do_concat(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list3.hasLength(0)) {
      return initial;
    } else {
      let x = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function fold_right(list3, initial, fun) {
  if (list3.hasLength(0)) {
    return initial;
  } else {
    let x = list3.head;
    let rest$1 = list3.tail;
    return fun(fold_right(rest$1, initial, fun), x);
  }
}
function do_index_fold(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index5 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index5);
      loop$with = with$;
      loop$index = index5 + 1;
    }
  }
}
function index_fold(over, initial, fun) {
  return do_index_fold(over, initial, fun, 0);
}
function find_map(loop$haystack, loop$fun) {
  while (true) {
    let haystack = loop$haystack;
    let fun = loop$fun;
    if (haystack.hasLength(0)) {
      return new Error(void 0);
    } else {
      let x = haystack.head;
      let rest$1 = haystack.tail;
      let $ = fun(x);
      if ($.isOk()) {
        let x$1 = $[0];
        return new Ok(x$1);
      } else {
        loop$haystack = rest$1;
        loop$fun = fun;
      }
    }
  }
}
function do_intersperse(loop$list, loop$separator, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let separator = loop$separator;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$separator = separator;
      loop$acc = prepend(x, prepend(separator, acc));
    }
  }
}
function intersperse(list3, elem) {
  if (list3.hasLength(0)) {
    return list3;
  } else if (list3.hasLength(1)) {
    return list3;
  } else {
    let x = list3.head;
    let rest$1 = list3.tail;
    return do_intersperse(rest$1, elem, toList([x]));
  }
}
function do_repeat(loop$a, loop$times, loop$acc) {
  while (true) {
    let a2 = loop$a;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$a = a2;
      loop$times = times - 1;
      loop$acc = prepend(a2, acc);
    }
  }
}
function repeat2(a2, times) {
  return do_repeat(a2, times, toList([]));
}
function do_split(loop$list, loop$n, loop$taken) {
  while (true) {
    let list3 = loop$list;
    let n = loop$n;
    let taken = loop$taken;
    let $ = n <= 0;
    if ($) {
      return [reverse(taken), list3];
    } else {
      if (list3.hasLength(0)) {
        return [reverse(taken), toList([])];
      } else {
        let x = list3.head;
        let xs = list3.tail;
        loop$list = xs;
        loop$n = n - 1;
        loop$taken = prepend(x, taken);
      }
    }
  }
}
function split(list3, index5) {
  return do_split(list3, index5, toList([]));
}
function do_split_while(loop$list, loop$f, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let f = loop$f;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return [reverse(acc), toList([])];
    } else {
      let x = list3.head;
      let xs = list3.tail;
      let $ = f(x);
      if (!$) {
        return [reverse(acc), list3];
      } else {
        loop$list = xs;
        loop$f = f;
        loop$acc = prepend(x, acc);
      }
    }
  }
}
function split_while(list3, predicate) {
  return do_split_while(list3, predicate, toList([]));
}
function key_find(keyword_list, desired_key) {
  return find_map(
    keyword_list,
    (keyword) => {
      let key = keyword[0];
      let value3 = keyword[1];
      let $ = isEqual(key, desired_key);
      if ($) {
        return new Ok(value3);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function key_set(list3, key, value3) {
  if (list3.hasLength(0)) {
    return toList([[key, value3]]);
  } else if (list3.atLeastLength(1) && isEqual(list3.head[0], key)) {
    let k = list3.head[0];
    let rest$1 = list3.tail;
    return prepend([key, value3], rest$1);
  } else {
    let first$1 = list3.head;
    let rest$1 = list3.tail;
    return prepend(first$1, key_set(rest$1, key, value3));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error2 = result[0];
    return new Error(fun(error2));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap2(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function nil_error(result) {
  return map_error(result, (_) => {
    return void 0;
  });
}

// build/dev/javascript/gleam_stdlib/gleam/string_builder.mjs
function from_strings(strings) {
  return concat(strings);
}
function from_string(string4) {
  return identity(string4);
}
function to_string3(builder) {
  return identity(builder);
}
function split3(iodata, pattern) {
  return split2(iodata, pattern);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function classify(data) {
  return classify_dynamic(data);
}
function int(data) {
  return decode_int(data);
}
function bool(data) {
  return decode_bool(data);
}
function shallow_list(value3) {
  return decode_list(value3);
}
function any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return any(decoders$1)(data);
      }
    }
  };
}
function push_path(error2, name) {
  let name$1 = identity(name);
  let decoder = any(
    toList([string, (x) => {
      return map3(int(x), to_string2);
    }])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify(name$1), ">"]);
      let _pipe$1 = from_strings(_pipe);
      return to_string3(_pipe$1);
    }
  })();
  return error2.withFields({ path: prepend(name$2, error2.path) });
}
function list(decoder_type) {
  return (dynamic) => {
    return try$(
      shallow_list(dynamic),
      (list3) => {
        let _pipe = list3;
        let _pipe$1 = try_map(_pipe, decoder_type);
        return map_errors(
          _pipe$1,
          (_capture) => {
            return push_path(_capture, "*");
          }
        );
      }
    );
  };
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map2(_capture, f);
    }
  );
}
function string(data) {
  return decode_string(data);
}
function field(name, inner_type) {
  return (value3) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value3, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at2] = val;
  return out;
}
function spliceIn(arr, at2, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at2) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at2) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root, key);
  }
}
function findArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root, key);
  }
}
function withoutArray(root, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key) {
  const idx = collisionIndexOf(root, key);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    let equal = true;
    this.forEach((v, k) => {
      equal = equal && isEqual(o.get(k, !v), v);
    });
    return equal;
  }
};

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value3) {
  if (/^[-+]?(\d+)$/.test(value3)) {
    return new Ok(parseInt(value3));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function string_length(string4) {
  if (string4 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string4.match(/./gsu).length;
  }
}
function graphemes(string4) {
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string4.match(/./gsu));
  }
}
function graphemes_iterator(string4) {
  if (globalThis.Intl && Intl.Segmenter) {
    return new Intl.Segmenter().segment(string4)[Symbol.iterator]();
  }
}
function pop_grapheme(string4) {
  let first3;
  const iterator = graphemes_iterator(string4);
  if (iterator) {
    first3 = iterator.next().value?.segment;
  } else {
    first3 = string4.match(/./su)?.[0];
  }
  if (first3) {
    return new Ok([first3, string4.slice(first3.length)]);
  } else {
    return new Error(Nil);
  }
}
function lowercase(string4) {
  return string4.toLowerCase();
}
function split2(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function contains_string(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var left_trim_regex = new RegExp(`^([${unicode_whitespaces}]*)`, "g");
var right_trim_regex = new RegExp(`([${unicode_whitespaces}]*)$`, "g");
function print_debug(string4) {
  if (typeof process === "object" && process.stderr?.write) {
    process.stderr.write(string4 + "\n");
  } else if (typeof Deno === "object") {
    Deno.stderr.writeSync(new TextEncoder().encode(string4 + "\n"));
  } else {
    console.log(string4);
  }
}
function compile_regex(pattern, options) {
  try {
    let flags = "gu";
    if (options.case_insensitive)
      flags += "i";
    if (options.multi_line)
      flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error2) {
    const number = (error2.columnNumber || 0) | 0;
    return new Error(new CompileError(error2.message, number));
  }
}
function regex_scan(regex, string4) {
  const matches = Array.from(string4.matchAll(regex)).map((match) => {
    const content = match[0];
    const submatches = [];
    for (let n = match.length - 1; n > 0; n--) {
      if (match[n]) {
        submatches[n - 1] = new Some(match[n]);
        continue;
      }
      if (submatches.length > 0) {
        submatches[n - 1] = new None();
      }
    }
    return new Match(content, List.fromArray(submatches));
  });
  return List.fromArray(matches);
}
function new_map() {
  return Dict.new();
}
function map_to_list(map6) {
  return List.fromArray(map6.entries());
}
function map_get(map6, key) {
  const value3 = map6.get(key, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function map_insert(key, value3, map6) {
  return map6.set(key, value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_bool(data) {
  return typeof data === "boolean" ? new Ok(data) : decoder_error("Bool", data);
}
function decode_list(data) {
  if (Array.isArray(data)) {
    return new Ok(List.fromArray(data));
  }
  return data instanceof List ? new Ok(data) : decoder_error("List", data);
}
function decode_field(value3, name) {
  const not_a_map_error = () => decoder_error("Dict", value3);
  if (value3 instanceof Dict || value3 instanceof WeakMap || value3 instanceof Map) {
    const entry = map_get(value3, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value3 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value3) == Object.prototype) {
    return try_get_field(value3, name, () => new Ok(new None()));
  } else {
    return try_get_field(value3, name, not_a_map_error);
  }
}
function try_get_field(value3, field3, or_else) {
  try {
    return field3 in value3 ? new Ok(new Some(value3[field3])) : or_else();
  } catch {
    return or_else();
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || t === "number")
    return v.toString();
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map6) {
  let body = "dict.from_list([";
  let first3 = true;
  map6.forEach((value3, key) => {
    if (!first3)
      body = body + ", ";
    body = body + "#(" + inspect(key) + ", " + inspect(value3) + ")";
    first3 = false;
  });
  return body + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label) => {
    const value3 = inspect(record[label]);
    return isNaN(parseInt(label)) ? `${label}: ${value3}` : value3;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list3) {
  return `[${list3.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function new$() {
  return new_map();
}
function insert(dict2, key, value3) {
  return map_insert(key, value3, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function do_keys_acc(loop$list, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let x = list3.head;
      let xs = list3.tail;
      loop$list = xs;
      loop$acc = prepend(x[0], acc);
    }
  }
}
function do_keys(dict2) {
  let list_of_pairs = map_to_list(dict2);
  return do_keys_acc(list_of_pairs, toList([]));
}
function keys(dict2) {
  return do_keys(dict2);
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function length3(string4) {
  return string_length(string4);
}
function lowercase2(string4) {
  return lowercase(string4);
}
function starts_with2(string4, prefix) {
  return starts_with(string4, prefix);
}
function concat3(strings) {
  let _pipe = strings;
  let _pipe$1 = from_strings(_pipe);
  return to_string3(_pipe$1);
}
function join2(strings, separator) {
  return join(strings, separator);
}
function pop_grapheme2(string4) {
  return pop_grapheme(string4);
}
function do_slice(string4, idx, len) {
  let _pipe = string4;
  let _pipe$1 = graphemes(_pipe);
  let _pipe$2 = drop(_pipe$1, idx);
  let _pipe$3 = take(_pipe$2, len);
  return concat3(_pipe$3);
}
function slice(string4, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = length3(string4) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return do_slice(string4, translated_idx, len);
      }
    } else {
      return do_slice(string4, idx, len);
    }
  }
}
function drop_left(string4, num_graphemes) {
  let $ = num_graphemes < 0;
  if ($) {
    return string4;
  } else {
    return slice(string4, num_graphemes, length3(string4) - num_graphemes);
  }
}
function split4(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = from_string(_pipe);
    let _pipe$2 = split3(_pipe$1, substring);
    return map2(_pipe$2, to_string3);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return to_string3(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function debug(term) {
  let _pipe = term;
  let _pipe$1 = inspect2(_pipe);
  print_debug(_pipe$1);
  return term;
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function negate(bool4) {
  if (bool4) {
    return false;
  } else {
    return true;
  }
}
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function custom(run) {
  return new Effect(
    toList([
      (actions) => {
        return run(actions.dispatch, actions.emit, actions.select);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_left(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index5) => {
      let key$1 = key + "-" + to_string2(index5);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key;
    } else if (element2 instanceof Element) {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key);
    } else {
      let elements2 = element2.elements;
      return do_element_list_handlers(elements2, handlers2, key);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new$(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value3) {
  return new Attribute(name, identity(value3), false);
}
function property(name, value3) {
  return new Attribute(name, identity(value3), true);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function class$(name) {
  return attribute("class", name);
}
function id(name) {
  return attribute("id", name);
}
function value(val) {
  return attribute("value", val);
}
function autocomplete(name) {
  return attribute("autocomplete", name);
}
function autofocus(should_autofocus) {
  return property("autofocus", should_autofocus);
}
function href(uri) {
  return attribute("href", uri);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$3() {
  return new Set2(new$());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new$()) && isEqual(
    diff2.removed,
    new$3()
  ) && isEqual(diff2.updated, new$());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    } else if (next2.elements !== void 0) {
      for (const fragmentElement of forceChild(next2)) {
        stack.unshift({ prev: prev2, next: fragmentElement, parent });
        prev2 = prev2?.nextSibling;
      }
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value3 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value3)
        el[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value3, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value3);
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value3);
      delegated.push([name.slice(10), value3]);
    } else if (name === "class") {
      className = className === null ? value3 : className + " " + value3;
    } else if (name === "style") {
      style = style === null ? value3 : style + value3;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value3;
    } else {
      if (el.getAttribute(name) !== value3)
        el.setAttribute(name, value3);
      if (name === "value" || name === "selected")
        el[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style !== null) {
    el.setAttribute("style", style);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value3] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value3);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property2) => {
        const path = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key)
        keyedChildren.set(key, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.elements !== void 0) {
    for (const inner of element2.elements) {
      yield* forceChild(inner);
    }
  } else if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init4, update: update2, view: view2 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init4(flags), update2, view2);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init4, effects], update2, view2) {
    this.root = root;
    this.#model = init4;
    this.#update = update2;
    this.#view = view2;
    this.#tickScheduled = window.requestAnimationFrame(
      () => this.#tick(effects.all.toArray(), true)
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.requestAnimationFrame(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   * @param {boolean} isFirstRender
   */
  #tick(effects = [], isFirstRender = false) {
    this.#tickScheduled = void 0;
    if (!this.#flush(effects, isFirstRender))
      return;
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = [], didUpdate = false) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      didUpdate ||= this.#model !== next;
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      effect({ dispatch, emit: emit2, select });
    }
    if (this.#queue.length > 0) {
      return this.#flush(effects, didUpdate);
    } else {
      return didUpdate;
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init4, update: update2, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init4(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event2) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    if (!this.#flush(false, effects))
      return;
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(didUpdate = false, effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      didUpdate ||= this.#model !== next;
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      effect({ dispatch, emit: emit2, select });
    }
    if (this.#queue.length > 0) {
      return this.#flush(didUpdate, effects);
    } else {
      return didUpdate;
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init4, update2, view2, on_attribute_change) {
    super();
    this.init = init4;
    this.update = update2;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init4, update2, view2) {
  return new App(init4, update2, view2, new None());
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function figure(attrs, children2) {
  return element("figure", attrs, children2);
}
function pre(attrs, children2) {
  return element("pre", attrs, children2);
}
function a(attrs, children2) {
  return element("a", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_keydown(msg) {
  return on2(
    "keydown",
    (event2) => {
      let _pipe = event2;
      let _pipe$1 = field("key", string)(_pipe);
      return map3(_pipe$1, msg);
    }
  );
}
function value2(event2) {
  let _pipe = event2;
  return field("target", field("value", string))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value2(event2);
      return map3(_pipe, msg);
    }
  );
}

// build/dev/javascript/decode/decode_ffi.mjs
function index2(data, key) {
  const int3 = Number.isInteger(key);
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const entry = data.get(key, void 0);
    return new Ok(entry);
  }
  if ((key === 1 || key === 2) && data instanceof List) {
    let i = 0;
    for (const value3 of data) {
      if (i === key)
        return new Ok(value3);
      i++;
    }
    return new Error("Indexable");
  }
  if (int3 && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    return new Ok(data[key]);
  }
  return new Error(int3 ? "Indexable" : "Dict");
}

// build/dev/javascript/decode/decode.mjs
var Decoder = class extends CustomType {
  constructor(continuation) {
    super();
    this.continuation = continuation;
  }
};
function into(constructor) {
  return new Decoder((_) => {
    return new Ok(constructor);
  });
}
function parameter(body) {
  return body;
}
function from2(decoder, data) {
  return decoder.continuation(data);
}
var string3 = /* @__PURE__ */ new Decoder(string);
var bool3 = /* @__PURE__ */ new Decoder(bool);
function list2(item) {
  return new Decoder(list(item.continuation));
}
function push_path2(errors, key) {
  let key$1 = identity(key);
  let decoder = any(
    toList([
      string,
      (x) => {
        return map3(int(x), to_string2);
      }
    ])
  );
  let key$2 = (() => {
    let $ = decoder(key$1);
    if ($.isOk()) {
      let key$22 = $[0];
      return key$22;
    } else {
      return "<" + classify(key$1) + ">";
    }
  })();
  return map2(
    errors,
    (error2) => {
      return error2.withFields({ path: prepend(key$2, error2.path) });
    }
  );
}
function index3(key, inner, data) {
  let $ = index2(data, key);
  if ($.isOk()) {
    let data$1 = $[0];
    let $1 = inner(data$1);
    if ($1.isOk()) {
      let data$2 = $1[0];
      return new Ok(data$2);
    } else {
      let errors = $1[0];
      return new Error(push_path2(errors, key));
    }
  } else {
    let kind = $[0];
    return new Error(
      toList([new DecodeError(kind, classify(data), toList([]))])
    );
  }
}
function at(path, inner) {
  return new Decoder(
    (data) => {
      let decoder = fold_right(
        path,
        inner.continuation,
        (dyn_decoder, segment) => {
          return (_capture) => {
            return index3(segment, dyn_decoder, _capture);
          };
        }
      );
      return decoder(data);
    }
  );
}
function subfield(decoder, field_path, field_decoder) {
  return new Decoder(
    (data) => {
      let constructor = decoder.continuation(data);
      let data$1 = from2(at(field_path, field_decoder), data);
      if (constructor.isOk() && data$1.isOk()) {
        let constructor$1 = constructor[0];
        let data$2 = data$1[0];
        return new Ok(constructor$1(data$2));
      } else if (!constructor.isOk() && !data$1.isOk()) {
        let e1 = constructor[0];
        let e2 = data$1[0];
        return new Error(append2(e1, e2));
      } else if (!data$1.isOk()) {
        let errors = data$1[0];
        return new Error(errors);
      } else {
        let errors = constructor[0];
        return new Error(errors);
      }
    }
  );
}
function field2(decoder, field_name, field_decoder) {
  return subfield(decoder, toList([field_name]), field_decoder);
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }
};
function regex_submatches(pattern, string4) {
  let _pipe = pattern;
  let _pipe$1 = compile(_pipe, new Options(true, false));
  let _pipe$2 = nil_error(_pipe$1);
  let _pipe$3 = map3(
    _pipe$2,
    (_capture) => {
      return scan(_capture, string4);
    }
  );
  let _pipe$4 = try$(_pipe$3, first);
  let _pipe$5 = map3(_pipe$4, (m) => {
    return m.submatches;
  });
  return unwrap2(_pipe$5, toList([]));
}
function noneify_query(x) {
  if (x instanceof None) {
    return new None();
  } else {
    let x$1 = x[0];
    let $ = pop_grapheme2(x$1);
    if ($.isOk() && $[0][0] === "?") {
      let query = $[0][1];
      return new Some(query);
    } else {
      return new None();
    }
  }
}
function noneify_empty_string(x) {
  if (x instanceof Some && x[0] === "") {
    return new None();
  } else if (x instanceof None) {
    return new None();
  } else {
    return x;
  }
}
function extra_required(loop$list, loop$remaining) {
  while (true) {
    let list3 = loop$list;
    let remaining = loop$remaining;
    if (remaining === 0) {
      return 0;
    } else if (list3.hasLength(0)) {
      return remaining;
    } else {
      let xs = list3.tail;
      loop$list = xs;
      loop$remaining = remaining - 1;
    }
  }
}
function pad_list(list3, size) {
  let _pipe = list3;
  return append2(
    _pipe,
    repeat2(new None(), extra_required(list3, size))
  );
}
function split_authority(authority) {
  let $ = unwrap(authority, "");
  if ($ === "") {
    return [new None(), new None(), new None()];
  } else if ($ === "//") {
    return [new None(), new Some(""), new None()];
  } else {
    let authority$1 = $;
    let matches = (() => {
      let _pipe = "^(//)?((.*)@)?(\\[[a-zA-Z0-9:.]*\\]|[^:]*)(:(\\d*))?";
      let _pipe$1 = regex_submatches(_pipe, authority$1);
      return pad_list(_pipe$1, 6);
    })();
    if (matches.hasLength(6)) {
      let userinfo = matches.tail.tail.head;
      let host = matches.tail.tail.tail.head;
      let port = matches.tail.tail.tail.tail.tail.head;
      let userinfo$1 = noneify_empty_string(userinfo);
      let host$1 = noneify_empty_string(host);
      let port$1 = (() => {
        let _pipe = port;
        let _pipe$1 = unwrap(_pipe, "");
        let _pipe$2 = parse(_pipe$1);
        return from_result(_pipe$2);
      })();
      return [userinfo$1, host$1, port$1];
    } else {
      return [new None(), new None(), new None()];
    }
  }
}
function do_parse(uri_string) {
  let pattern = "^(([a-z][a-z0-9\\+\\-\\.]*):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#.*)?";
  let matches = (() => {
    let _pipe = pattern;
    let _pipe$1 = regex_submatches(_pipe, uri_string);
    return pad_list(_pipe$1, 8);
  })();
  let $ = (() => {
    if (matches.hasLength(8)) {
      let scheme2 = matches.tail.head;
      let authority_with_slashes = matches.tail.tail.head;
      let path2 = matches.tail.tail.tail.tail.head;
      let query_with_question_mark = matches.tail.tail.tail.tail.tail.head;
      let fragment2 = matches.tail.tail.tail.tail.tail.tail.tail.head;
      return [
        scheme2,
        authority_with_slashes,
        path2,
        query_with_question_mark,
        fragment2
      ];
    } else {
      return [new None(), new None(), new None(), new None(), new None()];
    }
  })();
  let scheme = $[0];
  let authority = $[1];
  let path = $[2];
  let query = $[3];
  let fragment = $[4];
  let scheme$1 = noneify_empty_string(scheme);
  let path$1 = unwrap(path, "");
  let query$1 = noneify_query(query);
  let $1 = split_authority(authority);
  let userinfo = $1[0];
  let host = $1[1];
  let port = $1[2];
  let fragment$1 = (() => {
    let _pipe = fragment;
    let _pipe$1 = to_result(_pipe, void 0);
    let _pipe$2 = try$(_pipe$1, pop_grapheme2);
    let _pipe$3 = map3(_pipe$2, second);
    return from_result(_pipe$3);
  })();
  let scheme$2 = (() => {
    let _pipe = scheme$1;
    let _pipe$1 = noneify_empty_string(_pipe);
    return map(_pipe$1, lowercase2);
  })();
  return new Ok(
    new Uri(scheme$2, userinfo, host, port, path$1, query$1, fragment$1)
  );
}
function parse2(uri_string) {
  return do_parse(uri_string);
}
function to_string6(uri) {
  let parts = (() => {
    let $ = uri.fragment;
    if ($ instanceof Some) {
      let fragment = $[0];
      return toList(["#", fragment]);
    } else {
      return toList([]);
    }
  })();
  let parts$1 = (() => {
    let $ = uri.query;
    if ($ instanceof Some) {
      let query = $[0];
      return prepend("?", prepend(query, parts));
    } else {
      return parts;
    }
  })();
  let parts$2 = prepend(uri.path, parts$1);
  let parts$3 = (() => {
    let $ = uri.host;
    let $1 = starts_with2(uri.path, "/");
    if ($ instanceof Some && !$1 && $[0] !== "") {
      let host = $[0];
      return prepend("/", parts$2);
    } else {
      return parts$2;
    }
  })();
  let parts$4 = (() => {
    let $ = uri.host;
    let $1 = uri.port;
    if ($ instanceof Some && $1 instanceof Some) {
      let port = $1[0];
      return prepend(":", prepend(to_string2(port), parts$3));
    } else {
      return parts$3;
    }
  })();
  let parts$5 = (() => {
    let $ = uri.scheme;
    let $1 = uri.userinfo;
    let $2 = uri.host;
    if ($ instanceof Some && $1 instanceof Some && $2 instanceof Some) {
      let s = $[0];
      let u = $1[0];
      let h = $2[0];
      return prepend(
        s,
        prepend(
          "://",
          prepend(u, prepend("@", prepend(h, parts$4)))
        )
      );
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof Some) {
      let s = $[0];
      let h = $2[0];
      return prepend(s, prepend("://", prepend(h, parts$4)));
    } else if ($ instanceof Some && $1 instanceof Some && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof None && $1 instanceof None && $2 instanceof Some) {
      let h = $2[0];
      return prepend("//", prepend(h, parts$4));
    } else {
      return parts$4;
    }
  })();
  return concat3(parts$5);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options2 = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "connect";
  } else if (method instanceof Delete) {
    return "delete";
  } else if (method instanceof Get) {
    return "get";
  } else if (method instanceof Head) {
    return "head";
  } else if (method instanceof Options2) {
    return "options";
  } else if (method instanceof Patch) {
    return "patch";
  } else if (method instanceof Post) {
    return "post";
  } else if (method instanceof Put) {
    return "put";
  } else if (method instanceof Trace) {
    return "trace";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase2(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body, scheme, host, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return then$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function set_header(request, key, value3) {
  let headers = key_set(request.headers, lowercase2(key), value3);
  return request.withFields({ headers });
}
function to(url) {
  let _pipe = url;
  let _pipe$1 = parse2(_pipe);
  return then$(_pipe$1, from_uri);
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
};

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value3) {
    return value3 instanceof Promise ? new _PromiseLayer(value3) : value3;
  }
  static unwrap(value3) {
    return value3 instanceof _PromiseLayer ? value3.promise : value3;
  }
};
function resolve(value3) {
  return Promise.resolve(PromiseLayer.wrap(value3));
}
function then_await(promise, fn) {
  return promise.then((value3) => fn(PromiseLayer.unwrap(value3)));
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a2 = result[0];
        return callback(a2);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error2) {
    return new Error(new NetworkError(error2.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string6(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_json_body(response) {
  try {
    let body = await response.body.json();
    return new Ok(response.withFields({ body }));
  } catch (error2) {
    return new Error(new InvalidJsonBody());
  }
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var InvalidJsonBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/app/types/data.mjs
var Command = class extends CustomType {
  constructor(command, api, help_desc, flags) {
    super();
    this.command = command;
    this.api = api;
    this.help_desc = help_desc;
    this.flags = flags;
  }
};
var Flag = class extends CustomType {
  constructor(flag, header, help_desc) {
    super();
    this.flag = flag;
    this.header = header;
    this.help_desc = help_desc;
  }
};
var CommandData = class extends CustomType {
  constructor(commands, metadata) {
    super();
    this.commands = commands;
    this.metadata = metadata;
  }
};
var Record = class extends CustomType {
  constructor(title, desc) {
    super();
    this.title = title;
    this.desc = desc;
  }
};
var Metadata = class extends CustomType {
  constructor(id2, private$, created_at, collection_id, name) {
    super();
    this.id = id2;
    this.private = private$;
    this.created_at = created_at;
    this.collection_id = collection_id;
    this.name = name;
  }
};
var JsonData = class extends CustomType {
  constructor(records, metadata) {
    super();
    this.records = records;
    this.metadata = metadata;
  }
};
function new_flag() {
  return new Flag("", "", "");
}
function new_command_data() {
  return new CommandData(toList([]), new Metadata("", false, "", "", ""));
}

// build/dev/javascript/app/types/text.mjs
var Text2 = class extends CustomType {
  constructor(text2, style, html) {
    super();
    this.text = text2;
    this.style = style;
    this.html = html;
  }
};
var Span = class extends CustomType {
};
var Link = class extends CustomType {
};

// build/dev/javascript/app/types/model.mjs
var Model2 = class extends CustomType {
  constructor(state, valid_commands, input2, output, output_q, command_history, flag, pos, current_pos) {
    super();
    this.state = state;
    this.valid_commands = valid_commands;
    this.input = input2;
    this.output = output;
    this.output_q = output_q;
    this.command_history = command_history;
    this.flag = flag;
    this.pos = pos;
    this.current_pos = current_pos;
  }
};
var Loading = class extends CustomType {
};
var GO = class extends CustomType {
};
var LoadingFailed = class extends CustomType {
};
var InputsLocked = class extends CustomType {
};
function init2() {
  return new Model2(
    new Loading(),
    new_command_data(),
    "",
    toList([]),
    toList([]),
    toList([]),
    new_flag(),
    0,
    0
  );
}
function startup(data) {
  let text2 = toList([
    new Text2("[", "text-green-300", new Span()),
    new Text2("[", "text-green-400", new Span()),
    new Text2("ALL SYSTEMS GO", "text-green-500", new Span()),
    new Text2("]", "text-green-400", new Span()),
    new Text2("]", "text-green-300", new Span())
  ]);
  return init2().withFields({
    state: new GO(),
    valid_commands: data,
    output_q: text2
  });
}
function error(error2, model) {
  return model.withFields({
    output_q: toList([
      new Text2(error2, "text-yellow-500", new Span())
    ])
  });
}
function serious_error(error2, model) {
  return model.withFields({
    output_q: toList([new Text2(error2, "text-red-500", new Span())])
  });
}

// build/dev/javascript/app/types/msg.mjs
var FetchedCommands = class extends CustomType {
  constructor(data) {
    super();
    this.data = data;
  }
};
var FetchedCommandsFailed = class extends CustomType {
};
var KeyPress = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UpdateInput = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var InvalidCommand = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var PrettyPrint = class extends CustomType {
  constructor(char, str) {
    super();
    this.char = char;
    this.str = str;
  }
};
var InitPrettyPrint = class extends CustomType {
  constructor(char, txt, model) {
    super();
    this.char = char;
    this.txt = txt;
    this.model = model;
  }
};
var ChainPrint = class extends CustomType {
};
var FetchedData = class extends CustomType {
  constructor(data) {
    super();
    this.data = data;
  }
};
var FetchFailed = class extends CustomType {
};
var Reset = class extends CustomType {
};
var DownloadPDF = class extends CustomType {
};

// build/dev/javascript/app/api/api.mjs
function fetch_json(api, dispatch) {
  let $ = to(api);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "api/api",
      12,
      "fetch_json",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let req = $[0];
  let reqq = set_header(
    req,
    "X-Master-Key",
    "$2a$10$5YHLC4UsaDMiVzLdw03mfOGQiOaAiecd.zRWBH4Gqkc8X9vwR0zt."
  );
  try_await(
    send(reqq),
    (resp) => {
      return try_await(
        read_json_body(resp),
        (resp2) => {
          let $1 = resp2.status;
          if ($1 === 200) {
            let proficiency_decoder = (() => {
              let _pipe = into(
                parameter(
                  (title) => {
                    return parameter(
                      (desc) => {
                        return new Record(title, desc);
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(_pipe, "title", string3);
              return field2(_pipe$1, "desc", string3);
            })();
            let metadata_decoder = (() => {
              let _pipe = into(
                parameter(
                  (id2) => {
                    return parameter(
                      (private$) => {
                        return parameter(
                          (created_at) => {
                            return parameter(
                              (collection_id) => {
                                return parameter(
                                  (name) => {
                                    return new Metadata(
                                      id2,
                                      private$,
                                      created_at,
                                      collection_id,
                                      name
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(_pipe, "id", string3);
              let _pipe$2 = field2(_pipe$1, "private", bool3);
              let _pipe$3 = field2(_pipe$2, "createdAt", string3);
              let _pipe$4 = field2(
                _pipe$3,
                "collectionId",
                string3
              );
              return field2(_pipe$4, "name", string3);
            })();
            let data_decoder = (() => {
              let _pipe = into(
                parameter(
                  (record) => {
                    return parameter(
                      (metadata) => {
                        return new JsonData(record, metadata);
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(
                _pipe,
                "record",
                list2(proficiency_decoder)
              );
              let _pipe$2 = field2(_pipe$1, "metadata", metadata_decoder);
              return from2(_pipe$2, resp2.body);
            })();
            if (data_decoder.isOk()) {
              let data = data_decoder[0];
              dispatch(new FetchedData(data));
            } else {
              dispatch(new FetchFailed());
            }
          } else {
            dispatch(new FetchFailed());
          }
          return resolve(new Ok(void 0));
        }
      );
    }
  );
  return void 0;
}
function get_commands(dispatch) {
  let $ = to("https://api.jsonbin.io/v3/b/670da6a9acd3cb34a89703a7");
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "api/api",
      82,
      "get_commands",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let req = $[0];
  let reqq = set_header(
    req,
    "X-Master-Key",
    "$2a$10$5YHLC4UsaDMiVzLdw03mfOGQiOaAiecd.zRWBH4Gqkc8X9vwR0zt."
  );
  try_await(
    send(reqq),
    (resp) => {
      return try_await(
        read_json_body(resp),
        (resp2) => {
          let $1 = resp2.status;
          if ($1 === 200) {
            let flag_decoder = (() => {
              let _pipe = into(
                parameter(
                  (flag) => {
                    return parameter(
                      (header) => {
                        return parameter(
                          (help_desc) => {
                            return new Flag(flag, header, help_desc);
                          }
                        );
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(_pipe, "flag", string3);
              let _pipe$2 = field2(_pipe$1, "header", string3);
              return field2(_pipe$2, "help_desc", string3);
            })();
            let command_decoder = (() => {
              let _pipe = into(
                parameter(
                  (command) => {
                    return parameter(
                      (api) => {
                        return parameter(
                          (help_desc) => {
                            return parameter(
                              (flags) => {
                                return new Command(
                                  command,
                                  api,
                                  help_desc,
                                  flags
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(_pipe, "command", string3);
              let _pipe$2 = field2(_pipe$1, "api", string3);
              let _pipe$3 = field2(_pipe$2, "help_desc", string3);
              return field2(_pipe$3, "flags", list2(flag_decoder));
            })();
            let metadata_decoder = (() => {
              let _pipe = into(
                parameter(
                  (id2) => {
                    return parameter(
                      (private$) => {
                        return parameter(
                          (created_at) => {
                            return parameter(
                              (collection_id) => {
                                return parameter(
                                  (name) => {
                                    return new Metadata(
                                      id2,
                                      private$,
                                      created_at,
                                      collection_id,
                                      name
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(_pipe, "id", string3);
              let _pipe$2 = field2(_pipe$1, "private", bool3);
              let _pipe$3 = field2(_pipe$2, "createdAt", string3);
              let _pipe$4 = field2(
                _pipe$3,
                "collectionId",
                string3
              );
              return field2(_pipe$4, "name", string3);
            })();
            let data_decoder = (() => {
              let _pipe = into(
                parameter(
                  (commands) => {
                    return parameter(
                      (metadata) => {
                        return new CommandData(commands, metadata);
                      }
                    );
                  }
                )
              );
              let _pipe$1 = field2(
                _pipe,
                "record",
                list2(command_decoder)
              );
              let _pipe$2 = field2(_pipe$1, "metadata", metadata_decoder);
              return from2(_pipe$2, resp2.body);
            })();
            if (data_decoder.isOk()) {
              let data = data_decoder[0];
              dispatch(new FetchedCommands(data));
            } else {
              dispatch(new FetchFailed());
            }
          } else {
            dispatch(new FetchFailed());
          }
          return resolve(new Ok(void 0));
        }
      );
    }
  );
  return void 0;
}

// build/dev/javascript/app/app.ffi.mjs
var after = (ms, callback) => void window.setTimeout(callback, ms);
var scrollToBottom = (divId) => {
  const div2 = document.getElementById(divId);
  div2.scrollTo({
    top: div2.scrollHeight,
    behavior: "smooth"
  });
};
function openPDFInNewTab() {
  window.open("https://drive.google.com/file/d/1HJDEvwinORrVlJk80oL7NdPjmKcAhzO9/view", "_blank");
}

// build/dev/javascript/app/output/text_rendering.mjs
function after2(timeout, msg) {
  return from(
    (dispatch) => {
      return after(timeout, () => {
        return dispatch(msg);
      });
    }
  );
}
function pretty_print(char, str, model) {
  scrollToBottom("App-App-App");
  let $ = split(model.output, length2(model.output) - 1);
  let history = $[0];
  let recent = $[1];
  if (!recent.hasLength(1)) {
    throw makeError(
      "let_assert",
      "output/text_rendering",
      36,
      "pretty_print",
      "Pattern match failed, no pattern matched the value.",
      { value: recent }
    );
  }
  let output = recent.head;
  if (str === "") {
    return [
      model.withFields({
        output: append2(
          history,
          toList([new Text2(output.text + char, output.style, output.html)])
        )
      }),
      after2(25, new ChainPrint())
    ];
  } else {
    let split6 = pop_grapheme2(str);
    if (split6.isOk()) {
      let val = split6[0];
      let model$1 = model.withFields({
        output: append2(
          history,
          toList([new Text2(output.text + char, output.style, output.html)])
        )
      });
      let effect = after2(0, new PrettyPrint(val[0], val[1]));
      return [model$1, effect];
    } else {
      return [
        model.withFields({
          output: append2(
            history,
            toList([
              new Text2(output.text + char, output.style, output.html)
            ])
          )
        }),
        after2(25, new ChainPrint())
      ];
    }
  }
}
function init_pretty_print(char, line, model) {
  let new_model = model.withFields({
    output: append2(
      model.output,
      toList([new Text2("", line.style, line.html)])
    )
  });
  return pretty_print(char, line.text, new_model);
}
function not_link(str) {
  return negate(contains_string(str, "http"));
}
function split_on_link(words) {
  return split_while(words, not_link);
}
function process_text(loop$text, loop$output) {
  while (true) {
    let text2 = loop$text;
    let output = loop$output;
    if (text2[1].hasLength(0)) {
      let t = text2[0];
      return append2(
        output,
        toList([new Text2(join2(t, " "), "", new Span())])
      );
    } else if (text2[0].hasLength(0)) {
      let l = text2[1];
      if (l.hasLength(0)) {
        return output;
      } else {
        let x = l.head;
        let xs = l.tail;
        let link = new Text2(
          x,
          "underline text-purple-400 hover:text-purple-300",
          new Link()
        );
        loop$text = split_on_link(xs);
        loop$output = append2(output, toList([link]));
      }
    } else {
      let x = text2[0];
      let xs = text2[1];
      loop$text = split_on_link(xs);
      loop$output = append2(
        output,
        toList([new Text2(join2(x, " "), "", new Span())])
      );
    }
  }
}
function read_json(json) {
  let desc = (() => {
    let _pipe = process_text(
      (() => {
        let _pipe2 = split4(json.desc, " ");
        return split_on_link(_pipe2);
      })(),
      toList([])
    );
    return intersperse(_pipe, new Text2(" ", "", new Span()));
  })();
  return append2(
    toList([
      new Text2(
        json.title + "\n\n",
        "underline text-purple-400",
        new Span()
      )
    ]),
    desc
  );
}
function find_by_title(title, rec) {
  let $ = rec.title === title;
  if ($) {
    return new Ok(rec);
  } else {
    return new Error(void 0);
  }
}
function render_text(model) {
  let $ = model.output_q;
  if ($.hasLength(0)) {
    return [model.withFields({ state: new GO() }), none()];
  } else {
    let first3 = $.head;
    let rest = $.tail;
    return init_pretty_print(
      "",
      first3,
      model.withFields({ state: new InputsLocked(), output_q: rest })
    );
  }
}
function init_text_rendering(data, model) {
  let new_model = model.withFields({ flag: new Flag("", "", "") });
  let new_new_model = (() => {
    let $ = find_map(
      data.records,
      (_capture) => {
        return find_by_title(model.flag.header, _capture);
      }
    );
    if ($.isOk()) {
      let rec = $[0];
      return new_model.withFields({ output_q: read_json(rec) });
    } else {
      let $1 = model.flag.flag;
      if ($1 === "--all") {
        let $2 = map2(data.records, read_json);
        if ($2.atLeastLength(1)) {
          let first3 = $2.head;
          let last = $2.tail;
          let updated_last = (() => {
            let _pipe = map2(
              last,
              (ls) => {
                return append2(
                  toList([new Text2("\n\n", "", new Span())]),
                  ls
                );
              }
            );
            return flatten(_pipe);
          })();
          return new_model.withFields({
            output_q: append2(first3, updated_last)
          });
        } else {
          return new_model.withFields({
            output_q: (() => {
              let _pipe = map2(data.records, read_json);
              return flatten(_pipe);
            })()
          });
        }
      } else {
        return new_model.withFields({
          output_q: toList([
            new Text2(
              "Incorrect Flag: " + model.flag.flag,
              "text-yellow-500",
              new Span()
            )
          ])
        });
      }
    }
  })();
  return render_text(new_new_model);
}

// build/dev/javascript/app/output/command_parsing.mjs
function create_runner(input2) {
  return toList([
    new Text2(
      "\n\n[",
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2("runner", "py-2 Consolas text-purple-400", new Span()),
    new Text2(
      "] [",
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2(
      "\u{1F5BF} ~/shiloh-alleyne/cv",
      "py-2 Consolas text-purple-400",
      new Span()
    ),
    new Text2(
      "] [",
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2(
      "\u{1F5F2}main",
      "py-2 Consolas text-purple-400",
      new Span()
    ),
    new Text2(
      "] ",
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2(
      "\u2771",
      "py-2 font-bold Consolas text-purple-400",
      new Span()
    ),
    new Text2(
      "\u2771 ",
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2(input2 + "\n\n", "", new Span())
  ]);
}
function render_flag_error(new_model, command, flag) {
  if (flag === "--all") {
    return [
      new_model.withFields({ flag: new Flag("--all", "", "") }),
      from(
        (_capture) => {
          return fetch_json(command.api, _capture);
        }
      )
    ];
  } else if (flag === "") {
    let error_msg = toList([
      new Text2("The command: ", "text-yellow-400", new Span()),
      new Text2(command.command, "text-yellow-300", new Span()),
      new Text2(
        " requires a flag.\n\n",
        "text-yellow-400",
        new Span()
      ),
      new Text2("Run the command: ", "", new Span()),
      new Text2(
        "help --" + command.command,
        "text-purple-400",
        new Span()
      ),
      new Text2(
        " for infomation about the " + command.command + " command.",
        "",
        new Span()
      )
    ]);
    return render_text(new_model.withFields({ output_q: error_msg }));
  } else {
    let error_msg = toList([
      new Text2("The command: ", "text-yellow-400", new Span()),
      new Text2(command.command, "text-yellow-300", new Span()),
      new Text2(
        ", does not have the flag: ",
        "text-yellow-400",
        new Span()
      ),
      new Text2(flag, "text-yellow-300", new Span()),
      new Text2(".\n\n", "text-yellow-400", new Span()),
      new Text2("Run the command: ", "", new Span()),
      new Text2(
        "help --" + command.command,
        "text-purple-400",
        new Span()
      ),
      new Text2(
        " for infomation about the " + command.command + " command.",
        "",
        new Span()
      )
    ]);
    return render_text(new_model.withFields({ output_q: error_msg }));
  }
}
function render_invalid_command(new_model, command) {
  let error_msg = toList([
    new Text2("Invalid Command: ", "text-yellow-500", new Span()),
    new Text2(command, "text-yellow-400", new Span())
  ]);
  return render_text(new_model.withFields({ output_q: error_msg }));
}
function parse_command(input2, command) {
  let $ = input2 === command.command;
  if ($) {
    return new Ok(command);
  } else {
    return new Error(void 0);
  }
}
function execute_command(new_model, command) {
  let $ = find_map(
    new_model.valid_commands.commands,
    (_capture) => {
      return parse_command(command, _capture);
    }
  );
  if ($.isOk()) {
    let c = $[0];
    let $1 = is_empty(c.flags);
    if ($1) {
      return [
        new_model.withFields({ flag: new Flag("--all", "", "") }),
        from((_capture) => {
          return fetch_json(c.api, _capture);
        })
      ];
    } else {
      return render_flag_error(new_model, c, "");
    }
  } else {
    return render_invalid_command(new_model, command);
  }
}
function parse_flag(flag, command) {
  let $ = find_map(
    command.flags,
    (input2) => {
      let $1 = input2.flag === flag;
      if ($1) {
        return new Ok(input2);
      } else {
        return new Error(void 0);
      }
    }
  );
  if ($.isOk()) {
    let f = $[0];
    return new Ok(f);
  } else {
    return new Error(void 0);
  }
}
function execute_command_with_flag(new_model, input2, flag) {
  let $ = find_map(
    new_model.valid_commands.commands,
    (_capture) => {
      return parse_command(input2, _capture);
    }
  );
  if ($.isOk()) {
    let c = $[0];
    let $1 = parse_flag(flag, c);
    if ($1.isOk()) {
      let f = $1[0];
      return [
        new_model.withFields({ flag: f }),
        from((_capture) => {
          return fetch_json(c.api, _capture);
        })
      ];
    } else {
      return render_flag_error(new_model, c, flag);
    }
  } else {
    return render_invalid_command(new_model, input2);
  }
}
function gen_help(command, max2) {
  let buffer = concat3(repeat2(" ", max2 + 2 - length3(command.command)));
  return toList([
    new Text2(
      "[",
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2(
      command.command,
      "py-2 Consolas text-purple-400",
      new Span()
    ),
    new Text2(
      "]" + buffer,
      "py-2 font-bold Consolas text-purple-300",
      new Span()
    ),
    new Text2(command.help_desc, "", new Span())
  ]);
}
function parse_help(model) {
  let new_model = model.withFields({ flag: new Flag("", "", "") });
  let max2 = (() => {
    let lengths = map2(
      model.valid_commands.commands,
      (c) => {
        return length3(c.command);
      }
    );
    return fold(lengths, 0, max);
  })();
  let basic_help = (() => {
    let example = (() => {
      let $ = filter(
        model.valid_commands.commands,
        (command) => {
          return length2(command.flags) >= 2;
        }
      );
      if ($.atLeastLength(1)) {
        let first3 = $.head;
        return first3.command;
      } else {
        return "exampleCommand";
      }
    })();
    let help = (() => {
      let _pipe = map2(
        model.valid_commands.commands,
        (_capture) => {
          return gen_help(_capture, max2);
        }
      );
      let _pipe$1 = intersperse(
        _pipe,
        toList([new Text2("\n", "", new Span())])
      );
      return flatten(_pipe$1);
    })();
    let appendix = toList([
      new Text2(
        "\n\nYou can also supply a command as flag for ",
        "",
        new Span()
      ),
      new Text2("help", "text-purple-300", new Span()),
      new Text2(
        " to get more information about that specific command e.g.\n\n",
        "",
        new Span()
      ),
      new Text2("help ", "", new Span()),
      new Text2("--" + example, "text-purple-300", new Span())
    ]);
    return append2(help, appendix);
  })();
  return new_model.withFields({ output_q: basic_help });
}
function gen_command_help(command) {
  let $ = command.flags;
  if ($.hasLength(0)) {
    return toList([
      new Text2("The command: ", "", new Span()),
      new Text2(command.command, "text-purple-300", new Span()),
      new Text2(" takes no additonal flags.", "", new Span())
    ]);
  } else {
    let max2 = (() => {
      let lengths = map2(
        command.flags,
        (flag) => {
          return length3(flag.flag);
        }
      );
      return fold(lengths, 0, max);
    })();
    let flags = (() => {
      let _pipe = map2(
        command.flags,
        (flag) => {
          let buffer = concat3(
            repeat2(" ", max2 + 2 - length3(flag.flag))
          );
          return toList([
            new Text2(
              flag.flag + buffer,
              "text-purple-300",
              new Span()
            ),
            new Text2(flag.help_desc, "", new Span())
          ]);
        }
      );
      let _pipe$1 = intersperse(
        _pipe,
        toList([new Text2("\n", "", new Span())])
      );
      let _pipe$2 = flatten(_pipe$1);
      return append2(
        _pipe$2,
        toList([
          new Text2(
            "\n--all" + concat3(repeat2(" ", max2 + 2 - 5)),
            "text-purple-300",
            new Span()
          ),
          new Text2("everything at once", "", new Span())
        ])
      );
    })();
    let help = toList([
      new Text2(
        "help: " + command.command + "\n\n",
        "",
        new Span()
      ),
      new Text2(
        "Pass in any of these flags with the ",
        "",
        new Span()
      ),
      new Text2(command.command, "text-purple-300", new Span()),
      new Text2(
        " command to find out more infomation\n\n",
        "",
        new Span()
      )
    ]);
    return append2(help, flags);
  }
}
function render_command_help(new_model, flag) {
  let command = drop_left(flag, 2);
  let $ = find_map(
    new_model.valid_commands.commands,
    (_capture) => {
      return parse_command(command, _capture);
    }
  );
  if ($.isOk()) {
    let c = $[0];
    return render_text(
      new_model.withFields({ output_q: gen_command_help(c) })
    );
  } else {
    let error_msg = toList([
      new Text2("The command: ", "text-yellow-500", new Span()),
      new Text2(command, "text-yellow-300", new Span()),
      new Text2(
        " does not exist, therefore you cannot call help for it.",
        "text-yellow-500",
        new Span()
      ),
      new Text2(
        "\n\nType help for a list of valid commands.",
        "text-yellow-500",
        new Span()
      )
    ]);
    return render_text(new_model.withFields({ output_q: error_msg }));
  }
}
function parse_args(args, new_model) {
  if (args.atLeastLength(1) && args.head === "clear") {
    return [
      new_model,
      from((dispatch) => {
        return dispatch(new Reset());
      })
    ];
  } else if (args.atLeastLength(1) && args.head === "print") {
    let str = args.tail;
    return render_text(
      new_model.withFields({
        output_q: toList([
          new Text2(join2(str, " "), "", new Span())
        ])
      })
    );
  } else if (args.hasLength(2) && args.head === "help") {
    let flag = args.tail.head;
    return render_command_help(new_model, flag);
  } else if (args.hasLength(1) && args.head === "help") {
    return render_text(parse_help(new_model));
  } else if (args.hasLength(1) && args.head === "cv") {
    return [
      new_model,
      from((dispatch) => {
        return dispatch(new DownloadPDF());
      })
    ];
  } else if (args.hasLength(2)) {
    let command = args.head;
    let flag = args.tail.head;
    return execute_command_with_flag(new_model, command, flag);
  } else if (args.hasLength(1)) {
    let command = args.head;
    return execute_command(new_model, command);
  } else {
    return [
      new_model,
      from(
        (dispatch) => {
          return dispatch(new InvalidCommand(new_model.input));
        }
      )
    ];
  }
}
function parse_input(model) {
  let runner = create_runner(model.input);
  let new_model = model.withFields({
    input: "",
    output: append2(model.output, runner)
  });
  let args = split4(model.input, " ");
  let $ = model.state;
  if ($ instanceof GO) {
    return parse_args(args, new_model);
  } else {
    return [model, none()];
  }
}
function parse_keypress(key, model) {
  if (key === "Enter") {
    let inc = model.pos + 1;
    let new_model = model.withFields({
      command_history: append2(
        model.command_history,
        toList([[inc, model.input]])
      ),
      pos: inc,
      current_pos: inc + 1
    });
    return parse_input(new_model);
  } else if (key === "ArrowUp") {
    let inc_current = model.current_pos - 1;
    let command = key_find(model.command_history, inc_current);
    if (command.isOk()) {
      let c = command[0];
      return [
        model.withFields({ input: c, current_pos: inc_current }),
        none()
      ];
    } else {
      return [model, none()];
    }
  } else if (key === "ArrowDown") {
    let $ = model.current_pos > model.pos;
    if ($) {
      return [model, none()];
    } else {
      let inc = model.current_pos + 1;
      let command = key_find(model.command_history, inc);
      if (command.isOk()) {
        let c = command[0];
        return [
          model.withFields({ input: c, current_pos: inc }),
          none()
        ];
      } else {
        return [model, none()];
      }
    }
  } else {
    return [model, none()];
  }
}

// build/dev/javascript/app/output/pdf_download.mjs
function download_pdf(model) {
  openPDFInNewTab();
  let output_msg = toList([
    new Text2("PDF Downloaded.", "text-green-500", new Span())
  ]);
  return render_text(model.withFields({ output_q: output_msg }));
}

// build/dev/javascript/app/app.mjs
function init3(_) {
  return [init2(), from(get_commands)];
}
function update(model, msg) {
  debug(model.output);
  if (msg instanceof FetchedCommands) {
    let data = msg.data;
    return render_text(startup(data));
  } else if (msg instanceof FetchedCommandsFailed) {
    return render_text(
      serious_error(
        "Failed to correct init refresh page to restart",
        model
      ).withFields({ state: new LoadingFailed() })
    );
  } else if (msg instanceof KeyPress) {
    let key = msg[0];
    return parse_keypress(key, model);
  } else if (msg instanceof UpdateInput) {
    let value3 = msg[0];
    return [model.withFields({ input: value3 }), none()];
  } else if (msg instanceof InvalidCommand) {
    let command = msg[0];
    return render_text(error("Invalid Command: " + command, model));
  } else if (msg instanceof Reset) {
    return [
      model.withFields({ input: "", output: toList([]), output_q: toList([]) }),
      none()
    ];
  } else if (msg instanceof PrettyPrint) {
    let char = msg.char;
    let str = msg.str;
    return pretty_print(char, str, model);
  } else if (msg instanceof InitPrettyPrint) {
    let char = msg.char;
    let txt = msg.txt;
    let mod = msg.model;
    return init_pretty_print(char, txt, mod);
  } else if (msg instanceof ChainPrint) {
    return render_text(model);
  } else if (msg instanceof FetchedData) {
    let data = msg.data;
    return init_text_rendering(data, model);
  } else if (msg instanceof FetchFailed) {
    return render_text(
      serious_error("Failed to retrive data", model)
    );
  } else {
    return download_pdf(model);
  }
}
function view(model) {
  let header = toList([
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
  ]);
  return div(
    toList([
      class$("m-0 leading-inherit bg-[#121212] min-h-screen"),
      id("Background")
    ]),
    toList([
      div(
        toList([
          class$(
            "p-5 absolute top-0 bottom-0 w-full selection:bg-purple-500 selection:text-neutral-900"
          ),
          id("App-app")
        ]),
        toList([
          div(
            toList([
              class$(
                "p-5 h-full w-full overflow-y-auto scroll-smooth box-border border-2 border-purple-800 text-lg"
              ),
              id("App-App-App")
            ]),
            toList([
              figure(
                toList([class$("font-consolas text-purple-500")]),
                toList([
                  pre(
                    toList([class$("font-consolas")]),
                    toList([
                      text(join2(header, "\n")),
                      span(
                        toList([
                          class$("font-mono text-purple-400 drop-shadow-glow")
                        ]),
                        toList([text("\xA9 2024")])
                      )
                    ])
                  ),
                  pre(
                    toList([class$("font-mono py-2")]),
                    toList([
                      span(
                        toList([]),
                        toList([text("============== Type ")])
                      ),
                      span(
                        toList([class$("text-purple-300")]),
                        toList([text("'help'")])
                      ),
                      span(
                        toList([]),
                        toList([
                          text(
                            " to see the list of available commands. ===============\n"
                          )
                        ])
                      ),
                      span(
                        toList([class$("text-purple-300")]),
                        toList([
                          text(
                            "                                                                  made in gleam \u2605"
                          )
                        ])
                      )
                    ])
                  )
                ])
              ),
              pre(
                toList([
                  class$("whitespace-pre-wrap font-mono text-purple-500"),
                  id("output")
                ]),
                map2(
                  model.output,
                  (line) => {
                    let $ = line.html;
                    if ($ instanceof Span) {
                      return span(
                        toList([class$(line.style)]),
                        toList([text(line.text)])
                      );
                    } else {
                      return a(
                        toList([href(line.text)]),
                        toList([
                          span(
                            toList([class$(line.style)]),
                            toList([text(line.text)])
                          )
                        ])
                      );
                    }
                  }
                )
              ),
              pre(
                toList([class$("flex pt-4")]),
                toList([
                  pre(
                    toList([class$("flex-none")]),
                    toList([
                      span(
                        toList([class$("font-bold font-mono text-purple-300")]),
                        toList([text("[")])
                      ),
                      span(
                        toList([class$("font-mono text-purple-400")]),
                        toList([text("runner")])
                      ),
                      span(
                        toList([class$("font-bold font-mono text-purple-300")]),
                        toList([text("] [")])
                      ),
                      span(
                        toList([class$("font-mono text-purple-400")]),
                        toList([text("\u{1F5BF} ~/shiloh-alleyne/cv")])
                      ),
                      span(
                        toList([class$("font-bold font-mono text-purple-300")]),
                        toList([text("] [")])
                      ),
                      span(
                        toList([class$("font-mono text-purple-400")]),
                        toList([text("\u{1F5F2}main")])
                      ),
                      span(
                        toList([class$("font-bold font-mono text-purple-300")]),
                        toList([text("]")])
                      ),
                      span(
                        toList([class$("font-bold font-mono text-purple-400")]),
                        toList([text(" \u2771")])
                      ),
                      span(
                        toList([class$("font-bold font-mono text-purple-300")]),
                        toList([text("\u2771")])
                      )
                    ])
                  ),
                  input(
                    toList([
                      id("input"),
                      value(model.input),
                      on_input(
                        (var0) => {
                          return new UpdateInput(var0);
                        }
                      ),
                      on_keydown(
                        (var0) => {
                          return new KeyPress(var0);
                        }
                      ),
                      autofocus(true),
                      autocomplete("off"),
                      class$(
                        "snap center flex-auto px-2 w-full font-mono text-purple-500 bg-transparent border-none focus:outline-none"
                      )
                    ])
                  )
                ])
              )
            ])
          )
        ])
      )
    ])
  );
}
function main() {
  let app = application(init3, update, view);
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "app",
      24,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
