import fs from "fs";
import path from "path";
import { IQuote } from "./models";

export const authors = getAuthors();

export function getRandomQuote() {
    const author = getRandomAuthor();
    const bio = JSON.parse(fs.readFileSync(author.bioPath, "utf-8"));
    const quotes = JSON.parse(fs.readFileSync(author.quotesPath, "utf-8"));
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    return {
        author: author.name,
        bio: bio.bio,
        quote: quote[0],
        source: quote[1]
    } as IQuote;
}

function fromHyphenToCapitalized(str: string) {
    const dehyphened = str.replace(/-([a-z])/g, (_, letter) => " " + letter.toUpperCase());
    return dehyphened.slice(0, 1).toUpperCase() + dehyphened.slice(1);
}

function getAuthors() {
    return fs.readdirSync(path.join(__dirname, "quotes")).map(authorPath => ({
        name: fromHyphenToCapitalized(authorPath),
        bioPath: path.join(__dirname, "quotes", authorPath, "bio.json"),
        quotesPath: path.join(__dirname, "quotes", authorPath, "quotes.json"),
    }));
}

function getRandomAuthor() {
    const authors = getAuthors();
    return authors[Math.floor(Math.random() * authors.length)];
}