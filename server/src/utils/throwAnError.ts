import UserResponse from '../resolvers/objectTypes/UserResponseTypes';
export const throwAnError = (field: string, message: string): UserResponse => {
	return {
		errors: [
			{
				field: field,
				message: message
			}
		]
	};
};
