import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Badge,
  Button,
  Card,
  Col,
  FloatingLabel,
  Form,
  Stack,
} from "react-bootstrap";
import { truncateAddress } from "../../utils/conversions";
import Identicon from "../utils/Identicon";

const Memory = ({
  address,
  memory,
  sendFeedback,
  deleteMemory,
}) => {
  const { description, helpful, nothelpful, appId, owner, userFeedback } =
    memory;


  return (
    <Col key={appId}>
      <Card className="h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <span className="font-monospace text-secondary">
              {truncateAddress(owner)}
            </span>
            <Identicon size={28} address={owner} />
          </Stack>
        </Card.Header>

        <Card.Body className="d-flex flex-column text-center">
          <Card.Text className="flex-grow-1" style={{ paddingButtom: "2rem" }}>
            {description}
          </Card.Text>
          <Stack
            direction="horizontal"
            gap={2}
            style={{ paddingButtom: "5rem" }}
          >
            <Badge bg="secondary" className="ms-auto">
              {helpful} Helpful
            </Badge>
            <Badge bg="secondary" className="ms-auto">
              {nothelpful} Unhelpful
            </Badge>
          </Stack>

          {memory.owner !== address && (
            <Form>
            <Button
              variant="outline-primary mt-2"
              onClick={() => sendFeedback(memory, 1)}
              disabled={userFeedback === 2}
              className="btn"
            >
              Helpful
            </Button>
            </Form>
          )}

          {memory.owner !== address && (
            <Form>
            <Button
              style={{ marginTop: "0.5rem" }}
              variant="outline-danger"
              onClick={() => sendFeedback(memory, 0)}
              className="btn"
              disabled={userFeedback === 1}
            >
              Not Helpful
            </Button>
            </Form>
          )}

          {memory.owner === address && (
            <Form>
              <Button
              
                variant="outline-danger"
                onClick={() => deleteMemory(memory)}
                className="btn mt-2"
                style={{ marginLeft: "2rem" }}
              >
                <i className="bi bi-trash"></i>
              </Button>
              </Form>
        
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

Memory.propTypes = {
  address: PropTypes.string.isRequired,
  memory: PropTypes.instanceOf(Object).isRequired,
  sendFeedback: PropTypes.func.isRequired,
  deleteMemory: PropTypes.func.isRequired,
};

export default Memory;
