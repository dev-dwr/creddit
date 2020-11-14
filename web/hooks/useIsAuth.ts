import { useRouter } from "next/router";
import { useEffect } from "react";
import { useCheckLoginUsersQuery } from "../src/generated/graphql";


export const useIsAuth = () => {

    const [{data, fetching}]= useCheckLoginUsersQuery();
    
    const router = useRouter();
    
    useEffect(() => {
        if(!fetching && !data?.checkLoginUsers){
            router.replace("/login?next="+ router.pathname)
        }
    }, [fetching, data, router]);

}