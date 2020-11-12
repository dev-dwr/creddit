import { Box, IconButton, Link } from '@chakra-ui/core';
import React from 'react';
import NextLink from 'next/link';
import { useCheckLoginUsersQuery, useDeletePostMutation } from '../generated/graphql';
interface EditDeletePostButtonsProps {
	id: number;
	authorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({ id, authorId }) => {
    const [{}, deletePost] = useDeletePostMutation();
    const [{data}] = useCheckLoginUsersQuery();
    if(data?.checkLoginUsers?.id !== authorId){
        return null;
    }
    return (
		<Box ml="auto">
			<NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
				<IconButton as={Link} icon="edit" mr={4} aria-label="Edit Post"/>
			</NextLink>
			<IconButton
				icon="delete"
				variantColor="red"
				aria-label="Delete Post"
				onClick={() => {
					deletePost({
						id:id
					});
				}}
			/>
		</Box>
	);
};
