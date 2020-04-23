import React from 'react';
import { Link } from 'react-router-dom';

import { Container } from './styles';

import Logo from '../../assets/logo.svg';

interface HeaderProps {
    size?: 'small' | 'large';
}

const Header: React.FC<HeaderProps> = ({ size = 'large' }: HeaderProps) => {
    return (
        <Container size={size}>
            <header>
                <img src={Logo} alt="GoFinances" />
                <nav>
                    <Link to="/">
                        <p>List Transactions</p>
                    </Link>
                    <Link to="/import">
                        <p>Import Transaction</p>
                    </Link>
                </nav>
            </header>
        </Container>
    );
};

export default Header;
