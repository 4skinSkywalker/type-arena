import fs from "fs";
import path from "path";
import { IQuote, Language } from "./models";

export const authors = getAuthorFiles();

export function getRandomQuote(language: Language = "en") {
    const authorFile = getRandomAuthorFile(language);
    const authorName = fromHyphenToCapitalized(authorFile.name);
    const author = JSON.parse(fs.readFileSync(path.join(__dirname, "quotes", language, authorFile.base), "utf-8"));
    const randomQuote = author.quotes[Math.floor(Math.random() * author.quotes.length)];
    return {
        author: authorName,
        bio: author.bio || "",
        quote: randomQuote[0],
        source: randomQuote[1] || ""
    } as IQuote;
}

function fromHyphenToCapitalized(str: string) {
    const dehyphened = str.replace(/-([a-z])/g, (_, letter) => " " + letter.toUpperCase());
    return dehyphened.slice(0, 1).toUpperCase() + dehyphened.slice(1);
}

export function getAuthorFiles(language: Language = "en") {
    return fs.readdirSync(path.join(__dirname, "quotes", language))
        .map(file => path.parse(file));
}

export function getRandomAuthorFile(language: Language = "en") {
    const authors = getAuthorFiles(language);
    return authors[Math.floor(Math.random() * authors.length)];
}