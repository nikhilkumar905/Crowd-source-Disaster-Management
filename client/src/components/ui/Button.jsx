const variants = {
  primary: 'btn-primary',
  danger: 'btn-primary',
  outline: 'btn-ghost',
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  return (
    <button className={`${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
