import fs from "fs";
import path from "path";
import { IQuote, Language, QuoteLength } from "./models";

export const languageQuotes = ["en", "it"]
    .map(language => ({
        language,
        authors: getAuthorFiles(language as Language)
    }))
    .reduce((result, { language, authors }) => {
        result[language] = result[language] || {
            mixed: [],
            short: [],
            medium: [],
            long: []
        };

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

        result[language].mixed = [
            ...result[language].mixed,
            ...quotes
        ];
        
        result[language].short = [
            ...result[language].short,
            ...quotes.filter(q => q.quote.split(/\b/).length < 40)
        ];

        result[language].medium = [
            ...result[language].medium,
            ...quotes.filter(q => {
                const words = q.quote.split(/\b/);
                return words.length >= 40 && words.length <= 70;
            })
        ];

        result[language].long = [
            ...result[language].long,
            ...quotes.filter(q => q.quote.split(/\b/).length > 70)
        ];

        return result;
    }, {} as {
        [key: string]: {
            mixed: IQuote[],
            short: IQuote[],
            medium: IQuote[],
            long: IQuote[]
        }
    });

function fromHyphenToCapitalized(str: string) {
    const dehyphened = str.replace(/-([a-z])/g, (_, letter) => " " + letter.toUpperCase());
    return dehyphened.slice(0, 1).toUpperCase() + dehyphened.slice(1);
}

export function getAuthorFiles(language: Language = "en") {
    return fs.readdirSync(path.join(__dirname, "quotes", language))
        .map(file => path.parse(file));
}

export function getRandomQuote(language: Language = "en", quoteLength: QuoteLength) {
    const rnd = Math.floor(Math.random() * languageQuotes[language][quoteLength].length);
    return languageQuotes[language][quoteLength][rnd];
}