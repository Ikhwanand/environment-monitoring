import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const NavLink = ({ children, to }) => (
  <Link
    as={RouterLink}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    to={to}
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser, logout } = useAuth();

  return (
    <Box bg={useColorModeValue('white', 'gray.900')} px={4} shadow="sm">
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <Box>
          <Text
            as={RouterLink}
            to="/"
            fontSize="xl"
            fontWeight="bold"
            color="brand.500"
          >
            EnviroMonitor
          </Text>
        </Box>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            {currentUser ? (
              <>
                <NavLink to="/reports">Reports</NavLink>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <Button
                  variant="ghost"
                  onClick={logout}
                  _hover={{ bg: 'red.50', color: 'red.500' }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            )}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
}
