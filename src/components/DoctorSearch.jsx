import React from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';

const DoctorSearch = ({ value, onChange, placeholder = 'ابحث عن مدرس...' }) => {
  return (
    <Form.Group className="mb-2">
      <InputGroup>
        <Form.Control
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="search-doctor"
        />
        {value && (
          <Button
            variant="outline-secondary"
            onClick={() => onChange('')}
            aria-label="clear-search"
          >
            ×
          </Button>
        )}
      </InputGroup>
    </Form.Group>
  );
};

export default DoctorSearch;
