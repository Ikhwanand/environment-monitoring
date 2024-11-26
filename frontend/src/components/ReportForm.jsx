import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Text,
  RadioGroup,
  Radio,
  Stack,
  FormErrorMessage,
} from '@chakra-ui/react';
import { reports } from '../utils/api';

const ReportForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_name: '',
    latitude: '',
    longitude: '',
    mediaType: 'none', // 'none', 'image', or 'video'
    image: null,
    video: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleMediaTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      mediaType: value,
      image: null,
      video: null,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (!file) return;

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 10MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validate file type
      if (name === 'image' && !file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select an image file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (name === 'video' && !file.type.startsWith('video/')) {
        toast({
          title: 'Error',
          description: 'Please select a video file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      let newValue = value;
      
      // Handle number inputs
      if (type === 'number') {
        newValue = value === '' ? '' : Number(value);
      }

      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a regular object first
      const reportData = {
        title: formData.title,
        description: formData.description,
        location_name: formData.location_name,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        status: 'pending',
        severity: 'medium'
      };

      // Create FormData and append the JSON data
      const formDataObj = new FormData();
      
      // Append each field from reportData
      Object.keys(reportData).forEach(key => {
        formDataObj.append(key, reportData[key]);
      });

      // Only append the selected media type
      if (formData.mediaType === 'image' && formData.image) {
        formDataObj.append('image', formData.image);
      } else if (formData.mediaType === 'video' && formData.video) {
        formDataObj.append('video', formData.video);
      }

      await reports.create(formDataObj);

      toast({
        title: 'Report Created',
        description: 'Your environmental report has been submitted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Add a small delay before navigation
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (error) {
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
        Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') ||
        'Failed to create report. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter report title"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Description</FormLabel>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter report description"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Location Name</FormLabel>
            <Input
              name="location_name"
              value={formData.location_name}
              onChange={handleChange}
              placeholder="Enter location name"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Latitude</FormLabel>
            <Input
              name="latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="Enter latitude"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Longitude</FormLabel>
            <Input
              name="longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="Enter longitude"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Media Type</FormLabel>
            <RadioGroup value={formData.mediaType} onChange={handleMediaTypeChange}>
              <Stack direction="row" spacing={4}>
                <Radio value="none">No Media</Radio>
                <Radio value="image">Image</Radio>
                <Radio value="video">Video</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          {formData.mediaType === 'image' && (
            <FormControl>
              <FormLabel>Image</FormLabel>
              <Input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                p={1}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Maximum size: 10MB. Supported formats: JPG, PNG, GIF
              </Text>
            </FormControl>
          )}

          {formData.mediaType === 'video' && (
            <FormControl>
              <FormLabel>Video</FormLabel>
              <Input
                type="file"
                name="video"
                onChange={handleChange}
                accept="video/*"
                p={1}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Maximum size: 10MB. Supported formats: MP4, WebM, MOV
              </Text>
            </FormControl>
          )}

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Submitting..."
          >
            Submit Report
          </Button>
        </VStack>
      </Box>
    </Container>
  );
};

export default ReportForm;