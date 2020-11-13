import DataLoader from 'dataloader';
import { User } from '../entities/User';

//[1,3,6,7]
//[{id:1, username:"david"}, {}]
//keys = usersId
export const createUserLoader = () =>
	new DataLoader<number, User>(async (usersIds) => {
		const users = await User.findByIds(usersIds as number[]); //get all the users
		const userIdToUser: Record<number, User> = {};
		users.forEach((user) => {
			userIdToUser[user.id] = user;
		});
		return usersIds.map((userId) => userIdToUser[userId]);
	});
