import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

//MiddlewareFn special type from graphql
//middleware will runs before your resolver, you can also specify context as a generic
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
	if (!context.req.session.userId) {
		throw new Error('not authenticated');
	}
	//if everything goes well move on
	return next();
};
