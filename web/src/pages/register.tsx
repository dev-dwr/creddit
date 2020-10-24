import { Box, Button, FormControl, FormLabel, Input } from '@chakra-ui/core';
import {Formik, Form} from 'formik'
import React from 'react';
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
	return (
    <Wrapper variant ='small' >
        <Formik 
            initialValues={{username:"", password: ""}}
            onSubmit = {(values) => console.log(values)}>
            {({isSubmitting}) =>(
                <Form>
                    <Box mt ={4}>
                        <InputField name = 'username' placeholder = 'username' label ='Username' />
                    </Box>
                    <InputField name = 'password' placeholder = 'password' label ='Password' type = "password"/>
                    <Button isLoading = {isSubmitting} mt ={4} type ='submit' variantColor ='teal'>Register</Button>
                </Form>
            )}
        </Formik>
    </Wrapper>
	);
};

export default Register;
