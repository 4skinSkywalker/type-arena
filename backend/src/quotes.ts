import fs from "fs";
import path from "path";
import { IQuote, Language } from "./models";

export const languageQuotes = ["en", "it"]
    .map(language => ({
        language,
        authors: getAuthorFiles(language as Language)
    }))
    .reduce((result, { language, authors }) => {
        result[language] = result[language] || [];
        const quotes = authors
            .map(({ base, name }) => {
                const content = JSON.parse(fs.readFileSync(path.join(__dirname, "quotes", language, base), "utf-8"));
                return content.quotes
                    .map((quote: [string, string]) => ({
                        author: fromHyphenToCapitalized(name),
                        bio: "", // content.bio || "",
                        quote: quote[0],
                        source: "", // quote[1] || ""
                    })) as IQuote[];
            })
            .reduce((result, quotes) => result.concat(quotes), []);
        result[language] = [ ...result[language], ...quotes ];
        return result;
    }, {} as { [key: string]: IQuote[] });

function fromHyphenToCapitalized(str: string) {
    const dehyphened = str.replace(/-([a-z])/g, (_, letter) => " " + letter.toUpperCase());
    return dehyphened.slice(0, 1).toUpperCase() + dehyphened.slice(1);
}

export function getAuthorFiles(language: Language = "en") {
    return fs.readdirSync(path.join(__dirname, "quotes", language))
        .map(file => path.parse(file));
}

export function getRandomQuote(language: Language = "en") {
    const quotes = languageQuotes[language];
    if (!quotes) {
        throw new Error(`Language ${language} not found`);
    }
    return quotes[Math.floor(Math.random() * quotes.length)];
}