import { FieldError } from '../generated/graphql';

//response.data.register.errors -> an array of objects
//[{field:"username", message: "to short"}]
//toErrorMap
//output: {field:message} -> {"username": "to short"}
//converting an array of object to an object(map)
export const toErrorMap = (errors: FieldError[]) => {
	const errorMap: Record<string, string> = {};
	errors.forEach(({ field, message }) => {
		//{ field, message } comes from FieldError[]
		errorMap[field] = message;
	});
	return errorMap;
};
