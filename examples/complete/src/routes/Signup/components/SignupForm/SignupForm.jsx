import React from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import TextField from '@material-ui/core/TextField'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import { validateEmail } from 'utils/form'
import styles from './SignupForm.styles'

const useStyles = makeStyles(styles)

function SignupForm({ onSubmit }) {
  const classes = useStyles()
  const {
    register,
    handleSubmit,
    errors,
    formState: { isSubmitting, isValid }
  } = useForm({
    mode: 'onChange',
    nativeValidation: false
  })

  return (
    <form className={classes.root} onSubmit={handleSubmit(onSubmit)}>
      <TextField
        name="username"
        placeholder="username"
        autoComplete="username"
        margin="normal"
        fullWidth
        inputRef={register}
      />
      <TextField
        type="email"
        name="email"
        placeholder="email"
        autoComplete="email"
        margin="normal"
        fullWidth
        inputRef={register({
          required: true,
          validate: validateEmail
        })}
        error={!!errors.email}
        helperText={errors.email && 'Email must be valid'}
      />
      <TextField
        type="password"
        name="password"
        placeholder="password"
        autoComplete="current-password"
        margin="normal"
        fullWidth
        inputRef={register({
          required: true
        })}
        error={!!errors.password}
        helperText={errors.password && 'Password is required'}
      />
      <div className={classes.submit}>
        <Button
          color="primary"
          type="submit"
          variant="contained"
          disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Loading' : 'Signup'}
        </Button>
      </div>
    </form>
  )
}

SignupForm.propTypes = {
  onSubmit: PropTypes.func.isRequired
}

export default SignupForm
