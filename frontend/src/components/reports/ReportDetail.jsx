import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Badge,
  Image,
  Button,
  useToast,
  Spinner,
  VStack,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { reports } from '../../utils/api';
import CommentSection from '../comments/CommentSection';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await reports.get(id);
        setReport(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch report details',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!report) {
    return null;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      investigating: 'blue',
      in_progress: 'orange',
      resolved: 'green',
      rejected: 'red',
    };
    return colors[status] || 'gray';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[severity] || 'gray';
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Button onClick={() => navigate('/reports')} mb={4} variant="outline">
            Back to Reports
          </Button>
        </Box>

        <Box bg="white" p={6} borderRadius="lg" shadow="md">
          <VStack spacing={4} align="stretch">
            <Heading size="lg">{report.title}</Heading>

            <HStack spacing={4}>
              <Badge colorScheme={getStatusColor(report.status)}>
                Status: {report.status}
              </Badge>
              <Badge colorScheme={getSeverityColor(report.severity)}>
                Severity: {report.severity}
              </Badge>
            </HStack>

            <Divider />

            <Stack spacing={3}>
              <Text fontWeight="bold">Description</Text>
              <Text>{report.description}</Text>
            </Stack>

            <Stack spacing={3}>
              <Text fontWeight="bold">Location</Text>
              <Text>{report.location_name}</Text>
              <Text fontSize="sm" color="gray.600">
                Coordinates: {report.latitude}, {report.longitude}
              </Text>
            </Stack>

            {report.images && report.images.length > 0 && (
              <Stack spacing={3}>
                <Text fontWeight="bold">Images</Text>
                <HStack spacing={4} overflowX="auto" py={2}>
                  {report.images.map((image) => (
                    <Image
                      key={image.id}
                      src={image.image}
                      alt={image.caption || 'Report image'}
                      maxH="200px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                  ))}
                </HStack>
              </Stack>
            )}

            {report.videos && report.videos.length > 0 && (
              <Stack spacing={3}>
                <Text fontWeight="bold">Videos</Text>
                <HStack spacing={4} overflowX="auto" py={2}>
                  {report.videos.map((video) => (
                    <Box key={video.id}>
                      <video
                        controls
                        style={{ maxHeight: '200px', borderRadius: '8px' }}
                      >
                        <source src={video.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </Box>
                  ))}
                </HStack>
              </Stack>
            )}

            <Divider />

            <Stack spacing={2}>
              <Text fontSize="sm" color="gray.600">
                Reported by: {report.reporter.username}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Created: {new Date(report.created_at).toLocaleString()}
              </Text>
              {report.updated_at && (
                <Text fontSize="sm" color="gray.600">
                  Last updated: {new Date(report.updated_at).toLocaleString()}
                </Text>
              )}
            </Stack>
          </VStack>
        </Box>

        {/* Comments Section */}
        <Box bg="white" p={6} borderRadius="lg" shadow="md">
          <CommentSection reportId={id} comments={report.comments} />
        </Box>
      </VStack>
    </Container>
  );
};

export default ReportDetail;
