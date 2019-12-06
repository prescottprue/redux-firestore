import React from 'react'
import PropTypes from 'prop-types'
import TextField from '@material-ui/core/TextField'

function FormTextField({
  label,
  input,
  meta: { touched, invalid, error },
  ...custom
}) {
  return (
    <TextField
      label={label}
      placeholder={label}
      error={touched && invalid}
      helperText={touched && error}
      {...input}
      {...custom}
    />
  )
}

FormTextField.propTypes = {
  label: PropTypes.string,
  input: PropTypes.object,
  meta: PropTypes.shape({
    touched: PropTypes.bool,
    invalid: PropTypes.bool,
    error: PropTypes.string
  })
}

export default FormTextField
