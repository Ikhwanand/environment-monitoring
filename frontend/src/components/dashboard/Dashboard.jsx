import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Text,
  Container,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { reports } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboard } from '../../contexts/DashboardContext';

const StatCard = ({ title, value, helpText, accentColor }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  
  return (
    <Box p={6} bg={bgColor} rounded="lg" shadow="sm" position="relative">
      <Stat>
        <StatLabel fontSize="sm" color="gray.500">{title}</StatLabel>
        <StatNumber fontSize="3xl" fontWeight="bold" color={accentColor}>
          {value}
        </StatNumber>
        {helpText && (
          <StatHelpText fontSize="sm" color="gray.500">
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dashboardData, refreshDashboardData } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await refreshDashboardData();
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshDashboardData]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={5}>
        <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
          <Spinner size="xl" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={5}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={5}>
      <Box mb={5}>
        <Heading size="lg" mb={2}>Dashboard</Heading>
        <Text color="gray.600">Welcome back, {currentUser?.username || 'User'}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={8}>
        <StatCard
          title="Total Reports"
          value={dashboardData.totalReports}
          helpText="All time reports"
          accentColor="blue.500"
        />
        <StatCard
          title="Resolved Reports"
          value={dashboardData.resolvedReports}
          helpText="Successfully resolved"
          accentColor="green.500"
        />
        <StatCard
          title="Pending Reports"
          value={dashboardData.pendingReports}
          helpText="Awaiting resolution"
          accentColor="orange.500"
        />
      </SimpleGrid>

      <Box mb={8}>
        <Heading size="md" mb={4}>Recent Reports</Heading>
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Location</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {dashboardData.recentReports.map((report) => (
                <Tr key={report.id} _hover={{ bg: 'gray.50', cursor: 'pointer' }}
                    onClick={() => navigate(`/reports/${report.id}`)}>
                  <Td>{report.title}</Td>
                  <Td>{report.location_name}</Td>
                  <Td>
                    <Badge colorScheme={report.status === 'resolved' ? 'green' : 'orange'}>
                      {report.status}
                    </Badge>
                  </Td>
                  <Td>{new Date(report.created_at).toLocaleDateString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <Box>
        <Button
          as={RouterLink}
          to="/reports/new"
          colorScheme="blue"
          size="lg"
        >
          Create New Report
        </Button>
      </Box>
    </Container>
  );
}
