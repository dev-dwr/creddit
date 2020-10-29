import UsernamePasswordInput from '../resolvers/inputTypes/UsernamePasswordInput';

export const validateRegister = (options: UsernamePasswordInput) => {
	if (options.username.length <= 2) {
		return [
			//we can do this like that, due to specified response type in Mutation annotation

			{
				field: 'username',
				message: 'length must be greater than 2'
			}
		];
	}
	if (options.username.includes('@')) {
		return [
			//we can do this like that, due to specified response type in Mutation annotation
			{
				field: 'username',
				message: 'cannot include an @'
			}
		];
	}
	if (!options.email.includes('@')) {
		return [
			{
				field: 'email',
				message: 'invalid email'
			}
		];
	}

	if (options.password.length <= 4) {
		return [
			{
				field: 'password',
				message: 'length must be greater than 4'
			}
		];
	}
	return null;
};


