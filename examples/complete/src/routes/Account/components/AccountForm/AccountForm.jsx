import React from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import { validateEmail } from 'utils/form'
import ProviderDataForm from '../ProviderDataForm'
import styles from './AccountForm.styles'

const useStyles = makeStyles(styles)

function AccountForm({ account, onSubmit }) {
  const classes = useStyles()
  const {
    register,
    handleSubmit,
    errors,
    formState: { isSubmitting, isValid }
  } = useForm({
    mode: 'onChange',
    nativeValidation: false,
    defaultValues: account
  })

  return (
    <form className={classes.root} onSubmit={handleSubmit(onSubmit)}>
      <div className={classes.fields}>
        <TextField
          name="displayName"
          label="Display Name"
          margin="normal"
          inputRef={register}
          fullWidth
        />
        <TextField
          type="email"
          name="email"
          placeholder="email"
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
          name="avatarUrl"
          label="Avatar Url"
          margin="normal"
          inputRef={register}
          fullWidth
        />
      </div>
      {!!account && !!account.providerData && (
        <div>
          <Typography variant="h6">Linked Accounts</Typography>
          <ProviderDataForm providerData={account.providerData} />
        </div>
      )}
      <Button
        color="primary"
        type="submit"
        variant="contained"
        disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Saving' : 'Save'}
      </Button>
    </form>
  )
}

AccountForm.propTypes = {
  account: PropTypes.object,
  onSubmit: PropTypes.func.isRequired
}

export default AccountForm
