import React, { useState, useRef, useEffect } from 'react';
import {
  VStack,
  Box,
  Text,
  Avatar,
  HStack,
  Button,
  Textarea,
  useToast,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Collapse,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import { comments } from '../../utils/api';
import { FaThumbsUp, FaReply, FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';

const CommentForm = ({ onSubmit, initialValue = '', placeholder = 'Add a comment...', submitLabel = 'Post', isReply = false }) => {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
      if (formRef.current) {
        formRef.current.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" ref={formRef} onSubmit={handleSubmit} width="100%">
      <VStack spacing={2} align="stretch">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          size="sm"
          resize="vertical"
          bg="white"
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'blue.500', boxShadow: 'outline' }}
        />
        <Button
          type="submit"
          colorScheme="blue"
          size="sm"
          isLoading={isSubmitting}
          isDisabled={!content.trim() || isSubmitting}
          alignSelf="flex-end"
        >
          {submitLabel}
        </Button>
      </VStack>
    </Box>
  );
};

const Comment = ({ comment, onReply, onEdit, onDelete, onVote, depth = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const isOwnComment = currentUser?.id === comment.user?.id;

  const handleVoteClick = async () => {
    try {
      if (isOwnComment) {
        toast({
          title: "Cannot vote on own comment",
          description: "You cannot vote on your own comments",
          status: "warning",
          duration: 3000,
        });
        return;
      }
      await onVote(comment.id);
    } catch (error) {
      toast({
        title: "Error voting on comment",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Box pl={depth * 4}>
      <Box borderWidth="1px" borderRadius="md" p={3} bg="white">
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <HStack>
              <Avatar size="sm" name={comment.user?.username} />
              <Box>
                <Text fontWeight="bold">{comment.user?.username}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(comment.created_at).toLocaleString()}
                  {comment.edited && " (edited)"}
                </Text>
              </Box>
            </HStack>
            <HStack>
              <Button
                size="sm"
                leftIcon={<FaThumbsUp />}
                onClick={handleVoteClick}
                isDisabled={isOwnComment}
                colorScheme={comment.helpful_votes?.includes(currentUser?.id) ? "blue" : "gray"}
                variant={comment.helpful_votes?.includes(currentUser?.id) ? "solid" : "outline"}
                title={isOwnComment ? "You cannot vote on your own comments" : ""}
              >
                {comment.helpful_votes?.length || 0}
              </Button>
              <Button
                size="sm"
                leftIcon={<FaReply />}
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </Button>
              {(isOwnComment || currentUser?.is_staff) && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisV />}
                    variant="ghost"
                    size="sm"
                    aria-label="More options"
                  />
                  <MenuList>
                    {isOwnComment && (
                      <MenuItem
                        icon={<FaEdit />}
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </MenuItem>
                    )}
                    <MenuItem
                      icon={<FaTrash />}
                      onClick={() => onDelete(comment.id)}
                      color="red.500"
                    >
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </HStack>

          {isEditing ? (
            <CommentForm
              initialValue={comment.content}
              onSubmit={async (content) => {
                await onEdit(comment.id, content);
                setIsEditing(false);
              }}
              submitLabel="Save"
            />
          ) : (
            <Text>{comment.content}</Text>
          )}
        </VStack>
      </Box>

      <Collapse in={isReplying}>
        <Box mt={2} pl={4}>
          <CommentForm
            onSubmit={async (content) => {
              await onReply(comment.id, content);
              setIsReplying(false);
            }}
            placeholder="Write a reply..."
            submitLabel="Reply"
            isReply
          />
        </Box>
      </Collapse>

      {comment.replies?.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onVote={onVote}
          depth={depth + 1}
        />
      ))}
    </Box>
  );
};

const CommentSection = ({ reportId }) => {
  const [commentList, setCommentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await comments.getAll(reportId);
      setCommentList(response || []);
    } catch (error) {
      toast({
        title: "Error fetching comments",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (content) => {
    try {
      const comment = await comments.create(reportId, content);
      setCommentList([comment, ...commentList]);
      toast({
        title: "Comment added",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error adding comment",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleReply = async (commentId, content) => {
    try {
      const reply = await comments.reply(commentId, content);
      setCommentList(commentList.map(c => 
        c.id === commentId
          ? { ...c, replies: [...(c.replies || []), reply] }
          : c
      ));
    } catch (error) {
      toast({
        title: "Error adding reply",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleEdit = async (commentId, content) => {
    try {
      const updatedComment = await comments.update(commentId, content);
      setCommentList(commentList.map(c => 
        c.id === commentId ? updatedComment : c
      ));
    } catch (error) {
      toast({
        title: "Error updating comment",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await comments.delete(commentId);
      setCommentList(commentList.filter(c => c.id !== commentId));
    } catch (error) {
      toast({
        title: "Error deleting comment",
        description: error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleVote = async (commentId) => {
    try {
      const updatedComment = await comments.toggleHelpful(commentId);
      setCommentList(commentList.map(c => 
        c.id === commentId ? updatedComment : c
      ));
    } catch (error) {
      toast({
        title: "Error voting on comment",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 5000,
      });
    }
  };

  if (loading) {
    return (
      <Box py={4} display="flex" justifyContent="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" w="100%">
      <CommentForm onSubmit={handleAddComment} />
      {commentList.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={4}>
          No comments yet. Be the first to comment!
        </Text>
      ) : (
        commentList.map(comment => (
          <Comment
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onVote={handleVote}
          />
        ))
      )}
    </VStack>
  );
};

export default CommentSection;
