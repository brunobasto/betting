const { normalize } = require('betting-utils');

const haveNameSimilarity = (strA, strB) => {
    const [stringA, stringB] = [normalize(strA), normalize(strB)];

    return stringA.split(' ').some(word => {
        return (
            word.length > 2 &&
            stringB.split(' ').includes(word)
        )
    })
}

const abbreviate = (name) => {
    const [firstName, ...lastNames] = name.split(' ');

    return `${firstName[0].toUpperCase()} ${lastNames.join(' ')}`;
}

const compareAbbreviated = (nameA, nameB) => {
    const [stringA, stringB] = [normalize(nameA), normalize(nameB)];

    return (
        abbreviate(stringA) === stringB ||
        stringA === abbreviate(stringB)
    );
}

module.exports = {
    compareAbbreviated,
    haveNameSimilarity
}