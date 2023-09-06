import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  ModalFooter,
  Box,
} from "@chakra-ui/react";
import { useSearchUsersQuery } from "../../slices/userApiSlice";
import UserListItem from "./UserListItem";

const CreateChat = ({ isOpen, onClose }) => {
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const { data } = useSearchUsersQuery(searchUser);

  useEffect(() => {
    if (searchUser === "") {
      setSearchResults([]);
    } else {
      setSearchResults(data);
    }
  }, [searchUser]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setSearchUser("");
        }}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New Chat</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Search users by name, username or email"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
            {/* Show Users (based on input) */}
            <Box marginY="1rem">
              {/* {searchResults?.map((user) => (
                <UserListItem key={user._id} onClose={onClose} />
              ))} */}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="gray" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CreateChat;