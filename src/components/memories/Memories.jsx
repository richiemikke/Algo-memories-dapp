import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AddMemory from "./AddMemory";
import Memory from "./Memory";
import Loader from "../utils/Loader";
import {
  createMemoryAction,
  sendFeedbackAction,
  editAction,
  deleteMemoryAction,
  getMemoriesAction,
} from "../../utils/memories";
import PropTypes from "prop-types";
import { Row } from "react-bootstrap";

const Memories = ({ address, fetchBalance }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);

  const getMemories = useCallback(async () => {
    setLoading(true);
    toast.info("Getting memories");
    getMemoriesAction(address)
      .then((memories) => {
        if (memories) {
          setMemories(memories);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally((_) => {
        setLoading(false);
      });
  }, [address]);

  useEffect(() => {
    getMemories();
  }, [getMemories]);

  const createMemory = async (data) => {
    setLoading(true);
    toast.info("Creating new memory");
    createMemoryAction(address, data)
      .then(() => {
        toast.dismiss();
        toast.success("Memory has been added to the block-chain successfully.");
        getMemories();
        fetchBalance(address);
      })
      .catch((error) => {
        toast.dismiss();
        toast.error("Failed to add memory to the block-chain.");
        setLoading(false);
      });
  };

  const sendFeedback = async (memory, feedback) => {
    setLoading(true);
    toast.info("Sending Feedback");
    sendFeedbackAction(address, memory, Number(feedback))
      .then(() => {
        toast.dismiss();
        toast.success("Feedback sent successfully");
        getMemories();
        fetchBalance(address);
      })
      .catch((error) => {
        toast.dismiss();
        toast.error("Failed to send feedback.");
        setLoading(false);
      });
  };

  const editMemory = async (memory) => {
    setLoading(true);
    toast.info("Sending your changes");
    editAction(address, memory)
      .then(() => {
        toast.dismiss();
        toast.success("Memory edited successfully");
        getMemories();
        fetchBalance(address);
      })
      .catch((error) => {
        toast.dismiss();
        toast.error("failed to edit memory.");
        setLoading(false);
      });
  };

  const deleteMemory = async (memory) => {
    setLoading(true);
    toast.info("Deleting memory");
    deleteMemoryAction(address, memory.appId)
      .then(() => {
        toast.dismiss();
        toast.success(
          " memory has been succesfully deleted from the block-chain."
        );
        getMemories();
        fetchBalance(address);
      })
      .catch((error) => {
        toast.dismiss();
        toast.error("Failed to delete memory.");
        setLoading(false);
      });
  };

  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-4 fw-bold mb-0">Memory Dapp</h1>
        <AddMemory createMemory={createMemory} />
      </div>
      <Row xs={1} sm={2} lg={3} className="g-3 mb-5 g-xl-4 g-xxl-5">
        <>
          {memories.map((data, index) => (
            <Memory
              address={address}
              memory={data}
              sendFeedback={sendFeedback}
              editMemory={editMemory}
              deleteMemory={deleteMemory}
              key={index}
            />
          ))}
        </>
      </Row>
    </>
  );
};

Memories.propTypes = {
  address: PropTypes.string.isRequired,
  fetchBalance: PropTypes.func.isRequired,
};

export default Memories;
