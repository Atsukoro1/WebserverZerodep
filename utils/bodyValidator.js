// Will loop throught string and return every mistake in body
function checkString(body, schema) {
    if(!body) return ["Body should be defined!"];

    const MISTAKES = [];
    const VALUE = body[schema[0]];

    schema[1].split(";").forEach(validator => {
        switch(validator) {
            case "string": 
            case "number": 
            case "boolean":
                if(typeof(VALUE) != validator) 
                MISTAKES.push(`${schema[0]} should be ${validator}!`); 
                break;

            case "required":
                if(!VALUE) MISTAKES.push(`${schema[0]} is required!`);
                break;

            case "alphanum":
                if(typeof(VALUE) !== "string" || !VALUE.match(/^\w+$/)) MISTAKES.push(`${schema[0]} should be alphanumeric!`);
                break;

            case "email":
                if(typeof(VALUE) !== "string" || !VALUE.match(/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/i))
                MISTAKES.push(`${schema[0]} is not an email!`);
                break;

            case validator.includes("max") ? validator.match(/max:[0-9]*/g)[0] : null:
                if(VALUE.length > parseInt(validator.split(":")[1])) MISTAKES.push(`${schema[0]} should be lower than ${validator.split(":")[1]}!`);
                break;

            case validator.includes("min") ? validator.match(/min:[0-9]*/g)[0] : null:
                if(VALUE.length < parseInt(validator.split(":")[1])) MISTAKES.push(`${schema[0]} should be bigger than ${validator.split(":")[1]}!`);
                break;
        }
    });

    return MISTAKES;
};

// Will crawl throught whole body and find some errors
const validateBody = function(body, validationSchema) {
    const MISTAKES = [];

    Object.freeze();
    function checkArray(toCheck) {
        Object.entries(toCheck).forEach(el => {
            switch(typeof(el[1])) {
                case "string":
                    checkString(body, el).map(mist => MISTAKES.push(mist));
                    break;
    
                case "object":
                    break;
    
                default:
                    throw new Error("Validation schema is corrupted!");
            }
        })
    };

    checkArray(validationSchema);

    return MISTAKES;
};

module.exports = { validateBody };