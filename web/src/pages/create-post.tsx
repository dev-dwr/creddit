import { Box, Button, Text } from '@chakra-ui/core';
import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import { useIsAuth } from '../../hooks/useIsAuth';
import { InputField } from '../components/InputField';
import { Layout } from '../components/Layout';
import { useCreatePostMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const CreatePost: React.FC<{}> = ({}) => {
    const [ {}, createPost ] = useCreatePostMutation();
    useIsAuth();
    const router = useRouter();
	return (
		<Layout variant = "small">
			<Text mt={2} fontSize="2xl" fontWeight="semibold" lineHeight="short">
				Create Post
			</Text>
			<Formik
				initialValues={{ title: '', text: '' }}
				onSubmit={async (values) => {
                    const result = await createPost({options:values})
                    if(!result.error){
                        router.push("/")
                    }
                    
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
							CreatePost
						</Button>
					</Form>
				)}
			</Formik>
		</Layout>
	);
};

export default withUrqlClient(createUrqlClient) (CreatePost);
