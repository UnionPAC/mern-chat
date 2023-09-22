import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { clearSelectedChat } from "../../../slices/authSlice";
import { useDispatch } from "react-redux";
import {
  useDeleteChatMutation,
  useFetchChatsQuery,
} from "../../../slices/chatApiSlice";

const DeleteGroup = ({ isOpen, onClose }) => {
  /* REDUX STUFF */
  const { selectedChat, userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  /* QUERIES */
  const { refetch: refetchChats } = useFetchChatsQuery();

  /* MUTATIONS */
  const [deleteChat] = useDeleteChatMutation();

  const toast = useToast({
    isClosable: true,
    variant: "left-accent",
    position: "top-right",
    containerStyle: { fontSize: "14px" },
  });

  const handleDeleteGroup = async () => {
    try {
      const res = await deleteChat({ chatId: selectedChat._id }).unwrap();
      dispatch(clearSelectedChat());
      onClose();
      refetchChats();
    } catch (error) {
      toast({
        title: error.data.message,
        status: "error",
      });
    }
  };


  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Group
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to delete this group? This action cannot be
            undone.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button colorScheme="red" ml={3} onClick={handleDeleteGroup}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default DeleteGroup;
