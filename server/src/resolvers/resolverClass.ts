import {Query, Resolver} from 'type-graphql';

@Resolver()
export class ResolverClass{

    @Query(() => String)
    hello(){
        return "nice";
    }

}