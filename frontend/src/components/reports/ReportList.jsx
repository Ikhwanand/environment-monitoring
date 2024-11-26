import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Select,
  HStack,
  Input,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar,
  Flex,
  IconButton,
  Button,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { FaComment, FaThumbsUp } from 'react-icons/fa';
import { reports } from '../../utils/api';
import CommentSection from '../comments/CommentSection';

export default function ReportList() {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReport, setExpandedReport] = useState(null);

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await reports.getAll();
      setAllReports(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = allReports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red'
    };
    return colors[status] || 'gray';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
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
      <VStack spacing={5} align="stretch">
        <Heading size="lg" mb={4}>Environmental Reports</Heading>
        
        <HStack spacing={4}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width="200px"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="resolved">Resolved</option>
          </Select>
          
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            flex={1}
          />
        </HStack>

        <VStack spacing={4} align="stretch">
          {filteredReports.map(report => (
            <Card
              key={report.id}
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              overflow="hidden"
            >
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={4}>
                    <Avatar size="sm" name={report.reporter?.username || 'Anonymous'} />
                    <Box>
                      <RouterLink to={`/reports/${report.id}`}>
                        <Heading size="md" _hover={{ color: 'blue.500' }}>{report.title}</Heading>
                      </RouterLink>
                      <Text fontSize="sm" color="gray.500">
                        Posted by {report.reporter?.username || 'Anonymous'} on {formatDate(report.created_at)}
                      </Text>
                    </Box>
                  </Flex>
                  <Badge colorScheme={getStatusColor(report.status)}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                </Flex>
              </CardHeader>

              <CardBody>
                <Text noOfLines={3}>{report.description}</Text>
              </CardBody>

              <Divider />

              <CardFooter>
                <HStack spacing={4}>
                  <Button
                    leftIcon={<FaComment />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  >
                    Comments
                  </Button>
                  <RouterLink to={`/reports/${report.id}`}>
                    <Button variant="outline" size="sm">
                      View Full Report
                    </Button>
                  </RouterLink>
                </HStack>
              </CardFooter>

              {expandedReport === report.id && (
                <Box p={4} bg={useColorModeValue('gray.50', 'gray.800')}>
                  <CommentSection reportId={report.id} />
                </Box>
              )}
            </Card>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
}
