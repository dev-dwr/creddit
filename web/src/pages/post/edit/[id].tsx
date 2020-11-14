import { Box, Button, Text } from '@chakra-ui/core';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import { InputField } from '../../../components/InputField';
import { Layout } from '../../../components/Layout';
import { usePostQuery, useUpdatePostMutation } from '../../../generated/graphql';
import { createUrqlClient } from '../../../utils/createUrqlClient';

const EditPost: React.FC<{}> = ({}) => {
	
	const router = useRouter();

	const intId =  typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;
	
    const [{data, fetching}] = usePostQuery({
        pause: intId === -1,
        variables: {
          id: intId,
        },
	});
	
	const [{}, updatePost] = useUpdatePostMutation();
	
    if(fetching){
        return(
            <Layout>
                <div>loading ...</div>
            </Layout>
        )
    }
	
	if(!data?.post){
        return(
            <Layout>
                <Box>Could not find post</Box>
            </Layout>
        )
	}

	return (
		<Layout variant="small">
			<Text mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
				Edit post
			</Text>
			<Formik
			initialValues={{ title: data.post.title, text: data.post.text }}
			onSubmit={async (values) => {
              await updatePost({id:intId, options: {...values}})
              router.back()
			}}
			>
				{({ isSubmitting }) => (
					<Form>
						<Box mt={4}>
							<InputField name="title" placeholder="title" label="Title" />
						</Box>
						<Box>
							<InputField textarea name="text" placeholder="text..." label="Body" type="text" />
						</Box>
						<Button isLoading={isSubmitting} mt={4} type="submit" variantColor="teal">
							Update Post
						</Button>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient)(EditPost);
