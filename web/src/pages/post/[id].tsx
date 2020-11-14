import { Box, Heading } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import React from 'react'
import { EditDeletePostButtons } from '../../components/EditDeletePostButtons';
import { Layout } from '../../components/Layout';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { useRouter } from 'next/router';
import { usePostQuery } from '../../generated/graphql';


const PostDetails: React.FC<{}> = ({}) => {
    
    const router = useRouter();

    const intId = typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;

    const [{data, error, fetching}] = usePostQuery({
        pause: intId === -1, 
        variables:{
            id: intId
        }
    });
    
    if(fetching){
        return(
            <Layout>
                <Box>loading ...</Box>
            </Layout>
        )
    }
    if(error){
        return (
            <Layout>
                <Box>{error.message}</Box>
            </Layout>
        )
    }
    if(!data?.post){
        return(
            <Layout>
                <Box>could not find post</Box>
            </Layout>
        )
    }
    
    return (
        <Layout>
             <Heading mb = {4}>{data?.post?.title}</Heading>
             <Box mb={4}>
             {data?.post?.text}
             </Box>
             <EditDeletePostButtons id={data.post.id} authorId = {data.post.author.id}/>
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient, {ssr:true}) (PostDetails);