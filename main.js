const last = xs => xs[xs.length - 1];
const indexOf = (xs, x) => {
    let index = 0;
    for (const y of xs) if (y == x) break; else index++;
    return index;
};

// Complex arithmetic

class C {
    constructor(r, i) {
        this.real = r;
        this.imag = i ?? 0;
    };
};

const cAdd = (x, y) => new C(x.real + y.real, x.imag + y.imag);
const cSub = (x, y) => new C(x.real - y.real, x.imag - y.imag);
const cMul = (x, y) => new C(x.real * y.real - x.imag * y.imag, x.real * y.imag + x.imag * y.real);
const cDiv = (x, y) => {
    const denom = y.real * y.real + y.imag * y.imag;
    return new C(
        (x.real * y.real + x.imag * y.imag) / denom,
        (x.imag * y.real - x.real * y.imag) / denom,
    );
};

const toString = x => `${x.real < 0 ? "−" : "+"} ${Math.abs(x.real).toFixed(6)} ${x.imag < 0 ? "−" : "+"} ${Math.abs(x.imag).toFixed(6)}i`;

// Find value of polynomial for some value of x
const pEval = (f, x) => {
    let acc = new C(0);
    let variable = new C(1);
    for (let i = 0; i < f.length; i++) {
        acc = cAdd(acc, cMul(f[i], variable));
        variable = cMul(variable, x);
    };
    return acc;
};

// Durand-kerner method
function roots(f) {

    // Fix the stupid thing i hate you this caused so many bugs because i didnt realize the
    const first = last(f);
    f = f.map(x => cDiv(x, first));

    // Initial approximations
    const approx = n => {
        let list = [];
        let acc = new C(1);
        for (let i = 0; i < n; i++) {
            list.push(acc);
            acc = cMul(acc, new C(0.4, 0.9));
        };
        return list;
    };

    // Calculate denominator
    const denom = (k, xs) => xs.reduce((acc, x) => cMul(acc, cSub(k, x)), new C(1));

    // Apply iteration on a single root
    const next = (k, xs) => {
        return cSub(k, cDiv(pEval(f, k), denom(k, xs)))
    };

    // Apply iteration on all roots
    const apply = xs => {
        let list = [];
        for (let i = 0; i < xs.length; i++) {
            const k = xs[0];
            xs = xs.slice(1);
            list.push(next(k, xs));
            xs = [...xs, k];
        };
        return list;
    };

    const iters = 10 ** f.length;
    let xs = approx(f.length - 1);
    for (let i = 0; i < iters * 30; i++) xs = apply(xs);
    return xs;

};

// console.log(roots([new C(4), new C(3), new C(6)]).map(toString).join("\n"));

const div = document.getElementById("main");
const input = document.getElementById("input");
const outputReal = document.getElementById("roots-real");
const outputImaginary = document.getElementById("roots-imaginary");
const outputComplex = document.getElementById("roots-complex");

// Input GUI

document.addEventListener("focusout", event => {
    const coefficient = event.target;
    if (coefficient.className != "coefficient") return;

    const monomial = coefficient.parentNode;
    const sign = monomial.querySelector(".sign");

    if (coefficient.innerText[0] == "-") {
        coefficient.innerText = coefficient.innerText.slice(1);
        sign.innerHTML = "&#8722";
    } else {
        sign.innerText = monomial == monomial.parentNode.querySelector(".monomial") ? "" : "+";
    };

    const monomials = input.querySelectorAll(".monomial");

    if (last(monomials) == monomial && coefficient.innerText != "") {
        monomial.className = "monomial";
        let newMonomial = document.createElement("div");
        newMonomial.className = "monomial last";
        newMonomial.innerHTML = `<div class="sign">+</div> <div class="coefficient" contenteditable="true"></div>`
            + `<div class="variable"> ${monomials.length > 0 ? "x" : ""} </div> <div class="exponent"> ${monomials.length > 1 ? monomials.length : ""} </div>`;
        input.appendChild(newMonomial);
    } else if (monomials[monomials.length - 2] == monomial && coefficient.innerText == "") {
        input.removeChild(last(input.querySelectorAll(".monomial")));
        monomial.className = "monomial last";
        sign.innerText = monomial == input.querySelector(".monomial") ? "" : "+";
    } else if (coefficient.innerText == "") {
        coefficient.innerText = "0";
    };
});

document.addEventListener("focusin", event => {
    const coefficient = event.target;
    if (coefficient.className != "coefficient") return;

    const monomial = coefficient.parentNode;
    const sign = monomial.querySelector(".sign");
    const monomials = input.querySelectorAll(".monomial");

    if (monomial == last(monomials)) {
        monomial.className = "monomial";
        let newMonomial = document.createElement("div");
        newMonomial.className = "monomial last";
        newMonomial.innerHTML = `<div class="sign">+</div> <div class="coefficient" contenteditable="true"></div>`
            + `<div class="variable"> ${monomials.length > 0 ? "x" : ""} </div> <div class="exponent"> ${monomials.length > 1 ? monomials.length : ""} </div>`;
        input.appendChild(newMonomial);
    } else if (monomial == monomials[monomials.length - 2] && coefficient.innerText == "") {
        input.removeChild(event.path[2].lastChild);
        monomial.className = "monomial last";
        sign.innerText = monomial == input.querySelector(".monomial") ? "" : "+";
    };
});

document.addEventListener("input", event => {
    const element = event.target;
    const selection = window.getSelection();

    if (/^-{0,1}\d*\.?\d*$/.test(element.innerText)) {
        element.innerText = element.innerText;
        const added = element.innerText.length - (element.oldValue ? element.oldValue.length : 0);

        let range = document.createRange();
        range.setStart(element.childNodes[0], element.oldSelection ? element.oldSelection + added : added);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        element.oldValue = element.innerText;
        element.oldSelection = selection.focusOffset;
    } else if (element.hasOwnProperty("oldValue")) {
        element.innerText = element.oldValue;

        let range = document.createRange();
        range.setStart(element.childNodes[0], element.oldSelection);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        element.innerText = "";
    };
});

document.addEventListener("selectionchange", event => {
    const selection = document.getSelection();
    if (selection.focusNode == null) return;
    selection.focusNode.parentNode.oldSelection = selection.focusOffset;
});

document.addEventListener("keydown", event => {
    if (event.key == "Escape") return document.activeElement.blur();
    if (event.key != "ArrowLeft" && event.key != "ArrowRight") return;

    const direction = event.key != "ArrowLeft" ? 1 : -1;
    const selection = document.getSelection();

    if (selection.focusNode == null) return;

    const newOffset = selection.focusOffset + direction;
    const monomial = selection.focusNode.parentNode.parentNode;
    const monomials = input.querySelectorAll(".monomial");
    const index = indexOf(monomials, monomial);

    if (newOffset < 0) {
        const sibling = monomials[index - 1];

        if (sibling == null) return;

        const coefficient = sibling.querySelector(".coefficient");

        if (coefficient == undefined) return;

        event.preventDefault();
        const newSelection = coefficient.childNodes[0];

        let range = document.createRange();
        range.setStart(newSelection, newSelection.nodeValue.length);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        if (selection.focusNode.nodeValue == null) return;

        const length = selection.focusNode.nodeValue ? selection.focusNode.nodeValue.length : 0;

        if (newOffset <= length) return;
        if (monomial.className == "monomial last") return;

        const sibling = monomials[index + 1];
        const coefficient = sibling.querySelector(".coefficient");

        if (coefficient == undefined) return;
        if (coefficient.childNodes.length == 0) coefficient.appendChild(document.createTextNode(""));

        event.preventDefault();
        const newSelection = coefficient.childNodes[0];

        if (monomial.querySelector(".coefficient").innerText == "") return;

        let range = document.createRange();
        range.setStart(newSelection, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    };
});

document.addEventListener("copy", event => {
    event.clipboardData.setData("text", (document.getSelection() + "").replaceAll(" ", "").replaceAll("−", "-"));
    event.preventDefault();
});

// Calculate

const parseFromInput = () => {
    const unique = x => {
        let seen = {};
        let out = [];
        let len = x.length;
        let j = 0;
        for (let i = 0; i < len; i++) {
            const item = x[i];
            const stringified = `${item.real} ${item.imag}`;
            if (seen[stringified] !== 1) {
                seen[stringified] = 1;
                out[j++] = item;
            }
        }
        return out;
    }

    const inputDiv = document.getElementById("input");
    let polynomial = [];
    let sign = false;
    for (const x of inputDiv.childNodes) {
        for (let i = 0; i < 5; i++) {
            if (x.childNodes[i]) {
                if (x.childNodes[i].className == "sign" && x.childNodes[i].innerText == "−") sign = true;
                if (x.childNodes[i].className == "coefficient") {
                    const monomial = parseFloat(x.childNodes[i].innerText);
                    polynomial.push(new C(sign ? -monomial : monomial));
                    sign = false;
                };
            };
        };
    };
    polynomial.pop();
    for (let i = polynomial.length - 1; i >= 0; i--) if (polynomial[i].real != 0) break; else polynomial.pop();
    const round = x => Math.abs(x) != 0 ? Math.round(x * 1000000) / 1000000 : 0;
    let result = roots(polynomial).map(x => new C(round(x.real), round(x.imag)));
    result = unique(result);
    result.sort((x, y) => {
        if (x.real == y.real) return y.imag - x.imag;
        return y.real - x.real;
    });
    // console.log("Roots:\n " + result.map(toString).join("\n "));
    let resultReal = [];
    let resultImaginary = [];
    let resultComplex = [];
    for (const x of result) {
        const noReal = x.real == 0;
        const noImag = x.imag == 0
        if (noImag) resultReal.push(x);
        else if (noReal) resultImaginary.push(x);
        else resultComplex.push(x);
    };
    outputReal.querySelector(".solutions").innerText = resultReal.length + " real solution" + (resultReal.length != 1 ? "s" : "");
    outputReal.querySelector(".root-container").innerText = resultReal.map(x => `${x.real < 0 ? "−" : "+"} ${Math.abs(x.real).toFixed(6)}`).join("\n");
    outputImaginary.querySelector(".solutions").innerText = resultImaginary.length + " pure-imaginary solution" + (resultImaginary.length != 1 ? "s" : "");
    outputImaginary.querySelector(".root-container").innerText = resultImaginary.map(x => `${x.imag < 0 ? "−" : "+"} ${Math.abs(x.imag).toFixed(6)}i`).join("\n");
    outputComplex.querySelector(".solutions").innerText = resultComplex.length + " complex solution" + (resultComplex.length != 1 ? "s" : "");
    outputComplex.querySelector(".root-container").innerText = resultComplex.map(toString).join("\n");
};
